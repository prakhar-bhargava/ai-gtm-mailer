import { Body, Button, Column, Container, Head, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";
import type { CSSProperties } from "react";
import { allCaselets } from "@/lib/proof";
import { tidyBody } from "@/lib/gmail";
import type { Sender } from "@/lib/sender";

// Designed versions of a draft, built with React Email (react.email): components that render to the
// table-based, inline-styled HTML that Gmail, Outlook and Apple Mail display reliably.
// The words never change between designs; only the layout around them does.
//
// Gmail's compose link can't carry HTML, so a design reaches Gmail through the clipboard: "Copy formatted"
// (and "Open in Gmail", which copies at the same time) puts this HTML there, ready to paste.

export type MailDesign = "letter" | "card" | "quote";

export const MAIL_DESIGNS: { id: MailDesign; label: string; note: string }[] = [
  { id: "letter", label: "Letter", note: "Reads like a personal email. Best for a first touch." },
  { id: "card", label: "Card", note: "Logo header, the customer story as a callout, a booking button." },
  { id: "quote", label: "Quote", note: "Plain layout with the customer story set as a pull quote." },
];

type Parts = { greeting: string | null; paragraphs: { text: string; story: boolean }[]; cta: string | null };

const words = (text: string) => new Set(text.toLowerCase().match(/[a-z0-9%+]+/g) ?? []);

// Splits the body into greeting, paragraphs and the closing question, and finds the customer story by
// its overlap with the approved stories in the seller brief.
export function mailParts(body: string): Parts {
  const blocks = tidyBody(body).split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const greeting = blocks.length && /^(hi|hello|dear)\b/i.test(blocks[0]) && blocks[0].length < 40 ? blocks.shift()! : null;
  const cta = blocks.length > 1 && blocks[blocks.length - 1].trim().endsWith("?") ? blocks.pop()! : null;
  const stories = allCaselets().map((item) => words(item.text));
  const paragraphs = blocks.map((text) => {
    const own = words(text);
    const best = Math.max(0, ...stories.map((story) => [...own].filter((word) => story.has(word)).length / Math.max(own.size, 1)));
    return { text, story: best >= 0.5 };
  });
  return { greeting, paragraphs, cta };
}

const FONT = "Arial, Helvetica, sans-serif";
const INK = "#202124";
const MUTED = "#5f6368";
const BLUE = "#1a54ff";

const p: CSSProperties = { fontFamily: FONT, fontSize: "14px", lineHeight: "22px", color: INK, margin: "0 0 14px" };
const lines = (text: string) =>
  text.split("\n").flatMap((line, index) => (index ? [<br key={`b${index}`} />, line] : [line]));

function Signature({ sender, size = 40 }: { sender: Sender; size?: number }) {
  const small: CSSProperties = { fontFamily: FONT, fontSize: "13px", lineHeight: "19px", color: MUTED, margin: 0 };
  const site = sender.website.replace(/^https?:\/\//, "");
  return (
    <>
      <Text style={{ ...p, margin: "18px 0 8px" }}>{sender.signoff}</Text>
      <Row>
        {sender.logoUrl && (
          <Column style={{ width: `${size + 12}px`, verticalAlign: "top" }}>
            <Img src={sender.logoUrl} alt={sender.company} width={size} height={size} style={{ borderRadius: "8px", display: "block" }} />
          </Column>
        )}
        <Column style={{ verticalAlign: "top" }}>
          <Text style={{ ...small, color: INK, fontSize: "14px", fontWeight: 700 }}>{sender.name}</Text>
          {sender.title && <Text style={small}>{sender.title}</Text>}
          {sender.phone && <Text style={small}>{sender.phone}</Text>}
          <Text style={small}>
            {sender.company}
            {site && (
              <>
                {" · "}
                <Link href={`https://${site}`} style={{ color: BLUE, textDecoration: "none" }}>
                  {site}
                </Link>
              </>
            )}
          </Text>
        </Column>
      </Row>
    </>
  );
}

function LetterMail({ parts, sender }: { parts: Parts; sender: Sender }) {
  return (
    <Container style={{ maxWidth: "600px", margin: 0, padding: 0 }}>
      {parts.greeting && <Text style={p}>{parts.greeting}</Text>}
      {parts.paragraphs.map((item, index) => (
        <Text key={index} style={p}>
          {lines(item.text)}
        </Text>
      ))}
      {parts.cta && <Text style={p}>{parts.cta}</Text>}
      <Signature sender={sender} />
    </Container>
  );
}

function QuoteMail({ parts, sender }: { parts: Parts; sender: Sender }) {
  return (
    <Container style={{ maxWidth: "600px", margin: 0, padding: 0 }}>
      {parts.greeting && <Text style={p}>{parts.greeting}</Text>}
      {parts.paragraphs.map((item, index) =>
        item.story ? (
          <Section key={index} style={{ borderLeft: `3px solid ${BLUE}`, padding: "2px 0 2px 16px", margin: "4px 0 18px" }}>
            <Text style={{ ...p, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "16px", lineHeight: "25px", fontStyle: "italic", margin: 0 }}>
              {lines(item.text)}
            </Text>
          </Section>
        ) : (
          <Text key={index} style={p}>
            {lines(item.text)}
          </Text>
        ),
      )}
      {parts.cta && <Text style={{ ...p, fontWeight: 700 }}>{parts.cta}</Text>}
      <Signature sender={sender} />
    </Container>
  );
}

function CardMail({ parts, sender, preview }: { parts: Parts; sender: Sender; preview: string }) {
  return (
    <Section style={{ backgroundColor: "#f1f3f6", padding: "24px 12px" }}>
      <Preview>{preview}</Preview>
      <Container style={{ maxWidth: "560px", backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e3e6eb", overflow: "hidden" }}>
        <Section style={{ padding: "18px 28px", borderBottom: "1px solid #eef0f3" }}>
          <Row>
            {sender.logoUrl && (
              <Column style={{ width: "40px", verticalAlign: "middle" }}>
                <Img src={sender.logoUrl} alt="" width={28} height={28} style={{ borderRadius: "6px", display: "block" }} />
              </Column>
            )}
            <Column style={{ verticalAlign: "middle" }}>
              <Text style={{ fontFamily: FONT, fontSize: "15px", fontWeight: 700, color: INK, margin: 0 }}>{sender.company}</Text>
            </Column>
          </Row>
        </Section>
        <Section style={{ padding: "24px 28px 8px" }}>
          {parts.greeting && <Text style={p}>{parts.greeting}</Text>}
          {parts.paragraphs.map((item, index) =>
            item.story ? (
              <Section key={index} style={{ backgroundColor: "#f4f6ff", borderRadius: "10px", padding: "14px 18px", margin: "4px 0 18px" }}>
                <Text style={{ fontFamily: FONT, fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: BLUE, fontWeight: 700, margin: "0 0 6px" }}>
                  A team like yours
                </Text>
                <Text style={{ ...p, margin: 0 }}>{lines(item.text)}</Text>
              </Section>
            ) : (
              <Text key={index} style={p}>
                {lines(item.text)}
              </Text>
            ),
          )}
          {parts.cta && <Text style={{ ...p, fontWeight: 700 }}>{parts.cta}</Text>}
          {sender.bookingUrl && (
            <Button
              href={sender.bookingUrl}
              style={{ backgroundColor: BLUE, color: "#ffffff", fontFamily: FONT, fontSize: "14px", fontWeight: 700, borderRadius: "999px", padding: "11px 22px", margin: "2px 0 8px" }}
            >
              Pick a time
            </Button>
          )}
          <Hr style={{ borderColor: "#eef0f3", margin: "20px 0 4px" }} />
          <Signature sender={sender} size={36} />
          <Text style={{ height: "8px", margin: 0 }} />
        </Section>
      </Container>
    </Section>
  );
}

// The full HTML for one design. The fragment (no <html> or <body>) is what goes on the clipboard, since
// Gmail pastes the body's contents; the full document is used for the preview frame.
export async function renderMail(design: MailDesign, body: string, sender: Sender, options: { document?: boolean } = {}): Promise<string> {
  const parts = mailParts(body);
  const preview = parts.paragraphs[0]?.text.slice(0, 110) ?? "";
  const content =
    design === "card" ? (
      <CardMail parts={parts} sender={sender} preview={preview} />
    ) : design === "quote" ? (
      <QuoteMail parts={parts} sender={sender} />
    ) : (
      <LetterMail parts={parts} sender={sender} />
    );
  const html = await render(
    <Html lang="en">
      <Head />
      <Body style={{ margin: 0, padding: "12px", backgroundColor: design === "card" ? "#f1f3f6" : "#ffffff" }}>{content}</Body>
    </Html>,
  );
  if (options.document) return html;
  // Keep only what is inside <body>, wrapped in one div, for pasting.
  const inner = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  return `<div>${inner}</div>`;
}
