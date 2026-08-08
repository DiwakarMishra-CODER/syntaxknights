import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/mockmate/LenisProvider";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MockMate — An interviewer that thinks.",
  description:
    "MockMate conducts adaptive technical mock interviews, listens to your trade-offs, asks smarter follow-ups, and produces evidence-backed readiness evaluation.",
  keywords: [
    "Mock Interview",
    "Technical Interview Prep",
    "Adaptive Interview AI",
    "System Design Interview",
    "Coding Practice",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-[#050806] min-h-screen text-[#F5F7F4] selection:bg-[#1FD16A]/25 selection:text-[#1FD16A]">
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
