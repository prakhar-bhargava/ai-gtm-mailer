// Gmail hand-off. Gmail's compose link accepts plain text only, so the email's formatting is carried by
// its line breaks: a blank line between paragraphs, then the signature. Those survive the link exactly.
// For rich formatting (fonts, grey signature), copyFormatted puts an HTML version on the clipboard,
// which pastes into Gmail with its styling.

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

// The email as HTML: one <p> per paragraph, line breaks kept inside paragraphs, signature in grey.
export function mailHtml(body: string, signature: string[]): string {
  const font = "font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#202124;";
  const paragraphs = tidyBody(body)
    .split(/\n\s*\n/)
    .map((paragraph) => `<p style="margin:0 0 12px;${font}">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const sign = signature.length
    ? `<p style="margin:16px 0 0;${font}color:#5f6368;">${signature.map(escapeHtml).join("<br>")}</p>`
    : "";
  return `<div>${paragraphs}${sign}</div>`;
}

// Copies the email with formatting (HTML) and as plain text, so it pastes well anywhere.
export async function copyFormatted(subject: string, body: string, signature: string[]): Promise<void> {
  const plain = `${tidyBody(body)}\n\n${signature.join("\n")}`;
  const html = mailHtml(body, signature);
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
