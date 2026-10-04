// Gmail hand-off. Gmail's compose link accepts plain text only, so the email's formatting is carried by
// its line breaks: a blank line between paragraphs, then the signature. Those survive the link exactly.
// For rich formatting (fonts, signature with the company logo), copyFormatted puts an HTML version on the
// clipboard, which pastes into Gmail with its styling. The compose link can't carry images.

import { signatureLines, type Sender } from "@/lib/sender";

export type Mail = { to: string; subject: string; body: string };

// The body as it should read in Gmail: paragraphs separated by one blank line, no trailing spaces,
// at most one blank line in a row.
export function tidyBody(body: string): string {
  return body
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function gmailComposeUrl({ to, subject, body }: Mail): string {
  const params = [
    "view=cm",
    "fs=1",
    `to=${encodeURIComponent(to.trim())}`,
    `su=${encodeURIComponent(subject.trim())}`,
    `body=${encodeURIComponent(tidyBody(body))}`,
  ];
  return `https://mail.google.com/mail/?${params.join("&")}`;
}

// Opens Gmail compose in a new tab with the recipient, subject and body filled in.
// Call it directly from a click handler, before any await, or the browser may block the new tab.
export function openGmailDraft(mail: Mail): void {
  window.open(gmailComposeUrl(mail), "_blank", "noopener,noreferrer");
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The email as HTML: one <p> per paragraph, line breaks kept inside paragraphs, then the signature
// with the company logo beside it. Gmail keeps these inline styles when the HTML is pasted.
export function mailHtml(body: string, sender: Sender): string {
  const font = "font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#202124;";
  const paragraphs = tidyBody(body)
    .split(/\n\s*\n/)
    .map((paragraph) => `<p style="margin:0 0 12px;${font}">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const small = "font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#5f6368;";
  const website = sender.website
    ? `<a href="https://${escapeHtml(sender.website.replace(/^https?:\/\//, ""))}" style="color:#1a54ff;text-decoration:none;">${escapeHtml(sender.website)}</a>`
    : "";
  const details = [
    sender.title ? escapeHtml(sender.title) : "",
    sender.phone ? escapeHtml(sender.phone) : "",
    [sender.company ? escapeHtml(sender.company) : "", website].filter(Boolean).join(" · "),
  ].filter(Boolean);
  const logo = sender.logoUrl
    ? `<td style="padding:0 12px 0 0;vertical-align:top;"><img src="${escapeHtml(sender.logoUrl)}" alt="${escapeHtml(sender.company)}" width="40" height="40" style="display:block;width:40px;height:40px;border-radius:8px;"></td>`
    : "";
  const sign = `<p style="margin:16px 0 8px;${font}">${escapeHtml(sender.signoff)}</p>
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>${logo}<td style="vertical-align:top;${small}">
<strong style="color:#202124;font-size:14px;">${escapeHtml(sender.name)}</strong><br>${details.join("<br>")}</td></tr></table>`;
  return `<div>${paragraphs}${sign}</div>`;
}

// The full plain-text email: body, a blank line, then the signature.
export function plainMail(body: string, sender: Sender): string {
  return `${tidyBody(body)}\n\n${signatureLines(sender).join("\n")}`;
}

// Copies the email with formatting (HTML, with the logo) and as plain text, so it pastes well anywhere.
export async function copyFormatted(subject: string, body: string, sender: Sender): Promise<void> {
  const plain = plainMail(body, sender);
  const html = mailHtml(body, sender);
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      }),
    ]);
  } else {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${plain}`);
  }
}
