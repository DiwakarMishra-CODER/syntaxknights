import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MockMate — Technical Interviews That Actually Think",
  description:
    "MockMate is a next-generation technical interview platform that conducts realistic, adaptive mock interviews. It listens, understands reasoning, adapts follow-ups in real time, and evaluates technical depth.",
  keywords: [
    "Mock Interview",
    "Technical Interview Prep",
    "Adaptive Interview AI",
    "System Design Interview",
    "Coding Interview Practice",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${newsreader.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen selection:bg-[var(--accent-emerald-glow)] selection:text-[var(--accent-emerald)]">
        {children}
      </body>
    </html>
  );
}

