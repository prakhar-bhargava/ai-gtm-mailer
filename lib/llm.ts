import { createHash } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import llm from "@/config/llm.json";
import pipeline from "@/config/pipeline.json";
import { cacheGet, cacheSet } from "@/lib/cache";
import { takeSlot } from "@/lib/rate-limit";
import { trail } from "@/lib/trail";

// Readable message for the run view. Never includes the API key or the raw provider response.
export class LlmError extends Error {}

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  if (process.env.LLM_PROVIDER && process.env.LLM_PROVIDER !== llm.provider) {
    throw new LlmError(`LLM_PROVIDER is set to ${process.env.LLM_PROVIDER}, but only ${llm.provider} is wired up`);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new LlmError("the Gemini key is not set on the server");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

// One model call. It waits for a rate-limit slot first, then gets its own timeout.
async function send(model: string, system: string, contents: string, schema: z.ZodType): Promise<string> {
  await takeSlot();
  trail(`Asking the model (${model})`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), pipeline.modelTimeoutMs);
  try {
    const response = await getClient().models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(schema),
        temperature: 0.3,
        abortSignal: controller.signal,
      },
    });
    return response.text ?? "";
  } catch (error) {
    if (controller.signal.aborted) {
      throw new LlmError(`the model did not answer within ${pipeline.modelTimeoutMs / 1000} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

const TRANSIENT = /\b(429|503)\b|RESOURCE_EXHAUSTED|UNAVAILABLE/;

// Retries 429 (rate limit) and 503 (high demand) with the delays in config/llm.json.
// Each retry moves to the next model in the list, so one busy model doesn't stop the run.
async function sendWithRetry(system: string, contents: string, schema: z.ZodType): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const model = llm.models[attempt % llm.models.length];
    try {
      return await send(model, system, contents, schema);
    } catch (error) {
      if (error instanceof LlmError) throw error;
      const message = error instanceof Error ? error.message : "";
      const delay = llm.retryDelaysMs[attempt];
      if (!TRANSIENT.test(message) || delay === undefined) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Asks the model for JSON that matches the schema. If the answer doesn't parse or validate,
// it asks once more and includes the problem. A second failure fails the stage.
// Answers are cached by their exact prompt, so repeating a prospect costs no model calls.
export async function generateJson<T extends z.ZodType>(options: {
  system: string;
  prompt: string;
  schema: T;
}): Promise<z.output<T>> {
  const cacheKey = `llm:${createHash("sha256").update(options.system).update("\n").update(options.prompt).digest("hex")}`;
  const cached = cacheGet(cacheKey);
  if (cached !== null) {
    const hit = options.schema.safeParse(JSON.parse(cached));
    if (hit.success) {
      trail("Using an answer saved from an earlier run, no model call needed");
      return hit.data as z.output<T>;
    }
  }

  try {
    let contents = options.prompt;
    let problem = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) {
        contents = `${options.prompt}\n\nYour previous answer was rejected because ${problem}. Reply again with JSON that fixes this.`;
      }
      const text = await sendWithRetry(options.system, contents, options.schema);

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        problem = "it was not valid JSON";
        continue;
      }
      const result = options.schema.safeParse(json);
      if (result.success) {
        cacheSet(cacheKey, JSON.stringify(json));
        return result.data as z.output<T>;
      }
      problem = result.error.issues.map((issue) => `${issue.path.join(".") || "answer"} ${issue.message}`).join("; ");
    }
    throw new LlmError(`the model's answer did not match the format after one retry (${problem})`);
  } catch (error) {
    if (error instanceof LlmError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (TRANSIENT.test(message)) throw new LlmError("Gemini is busy right now (high demand). Try again in a minute");
    throw new LlmError("the model service returned an error");
  }
}
