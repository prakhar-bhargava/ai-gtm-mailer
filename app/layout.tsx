import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Plex Sans for the interface; Plex Serif only for the email itself, so the draft reads like a letter.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GTM Associate",
  description: "Research a prospect, pick a reason to write, and review a sourced draft before anything is sent.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-page text-foreground">
        <AppNav />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
