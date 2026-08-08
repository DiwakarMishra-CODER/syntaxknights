import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Sora stays loaded for the dashboard / mockmate surfaces (they use
// .font-editorial). The public landing uses Geist (display) + Inter (body).
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
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
      className={`${inter.variable} ${GeistSans.variable} ${sora.variable} dark`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-background min-h-screen text-foreground selection:bg-primary/25 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
