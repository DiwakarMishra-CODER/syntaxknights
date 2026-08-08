import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/mockmate/LenisProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

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
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-slate-50 text-slate-900 dark:bg-[#050806] dark:text-[#F5F7F4] selection:bg-[#1FD16A]/25 selection:text-[#1FD16A] transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <LenisProvider>
            {children}
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
