import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";

import "./globals.css";

/**
 * Two voices, and the contrast between them is the design.
 * Newsreader: low-contrast serif built for screens — warm, slightly
 * informal, a person speaking. Not the high-contrast display serif of the
 * editorial look.
 * IBM Plex Mono: designed for technical readouts — the machine measuring.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-newsreader",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Practice interview — Tyler Brooks",
  description: "An adaptive practice technical interview for cohort graduates.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
