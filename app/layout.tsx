import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Serif, Inter_Tight } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Inter Tight for the interface and headlines; Plex Mono for the small "machine voice" labels and buttons;
// Plex Serif only for the email itself, so the draft reads like a letter.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "GTM Associate",
  description: "An AI employee for outbound: it researches a prospect, picks the one reason worth writing about, and drafts an email where every fact links to its source.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${interTight.variable} ${plexMono.variable} ${plexSerif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-page text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
