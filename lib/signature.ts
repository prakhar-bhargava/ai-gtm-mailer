import sender from "@/config/sender.json";

// The sign-off block for every email, from config/sender.json.
export function signatureLines(): string[] {
  return [sender.signoff, sender.name, sender.title, `${sender.company} · ${sender.website}`].filter(Boolean);
}

export const senderName = sender.name;
export const senderCompany = sender.company;
