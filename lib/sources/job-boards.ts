import { SourceError, fetchText } from "@/lib/sources/http";

export type Job = {
  title: string;
  url: string;
  department: string | null;
  updatedAt: string | null;
};

export type JobBoard = { provider: "Greenhouse" | "Ashby"; slug: string; jobs: Job[] };

// Public job-board APIs. They need no key, and a board that doesn't exist returns 404.
// Returns null when no board exists for any of the slugs.
export async function findJobBoard(slugs: string[]): Promise<JobBoard | null> {
  for (const slug of slugs) {
    const greenhouse = await loadGreenhouse(slug);
    if (greenhouse) return greenhouse;
    const ashby = await loadAshby(slug);
    if (ashby) return ashby;
  }
  return null;
}

async function loadGreenhouse(slug: string): Promise<JobBoard | null> {
  try {
    const body = await fetchText(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`, {
      cacheKey: `greenhouse:${slug}`,
      accept: "application/json",
    });
    const data = JSON.parse(body) as {
      jobs: { title: string; absolute_url: string; updated_at: string; departments?: { name: string }[] }[];
    };
    const jobs = data.jobs.map((job) => ({
      title: job.title,
      url: job.absolute_url,
      department: job.departments?.[0]?.name ?? null,
      updatedAt: job.updated_at ?? null,
    }));
    return { provider: "Greenhouse", slug, jobs };
  } catch (error) {
    if (error instanceof SourceError && error.status === 404) return null;
    throw error;
  }
}

async function loadAshby(slug: string): Promise<JobBoard | null> {
  try {
    const body = await fetchText(`https://api.ashbyhq.com/posting-api/job-board/${slug}`, {
      cacheKey: `ashby:${slug}`,
      accept: "application/json",
    });
    const data = JSON.parse(body) as {
      jobs: { title: string; jobUrl: string; publishedAt?: string; department?: string }[];
    };
    const jobs = data.jobs.map((job) => ({
      title: job.title,
      url: job.jobUrl,
      department: job.department ?? null,
      updatedAt: job.publishedAt ?? null,
    }));
    return { provider: "Ashby", slug, jobs };
  } catch (error) {
    if (error instanceof SourceError && error.status === 404) return null;
    throw error;
  }
}
