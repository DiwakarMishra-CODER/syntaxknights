import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/mockmate/LenisProvider";
import { ThemeProvider } from "@/components/mockmate/ThemeProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
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
  title: "MockMate — Adaptive AI Mock Interviews",
  description:
    "MockMate conducts realistic, adaptive technical mock interviews. It listens to your trade-offs and evaluates technical depth in real time.",
  keywords: [
    "Mock Interview",
    "Technical Interview Prep",
    "Adaptive Interview AI",
    "System Design Interview",
    "Coding Practice",
  ],
};

function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.02] mix-blend-multiply dark:mix-blend-screen"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-[var(--bg-base)] text-[var(--ink-primary)] min-h-screen selection:bg-[var(--accent-emerald-soft)] selection:text-[var(--accent-emerald)]">
        <ThemeProvider>
          <LenisProvider>
            <NoiseOverlay />
            {children}
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
