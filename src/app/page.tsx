"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { AdaptiveFlow } from "@/components/landing/AdaptiveFlow";
import { InterviewDemo } from "@/components/landing/InterviewDemo";
import { ReadinessReport } from "@/components/landing/ReadinessReport";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  const router = useRouter();

  const handleStartPracticing = () => router.push("/dashboard");

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar onOpenStartModal={handleStartPracticing} />

      <main className="relative z-10">
        {/* 1. Hero Anchor */}
        <Hero onOpenStartModal={handleStartPracticing} />

        {/* 2. Comparison Matrix & Adaptive Reasoning Loop */}
        <AdaptiveFlow />

        {/* 3. Live Interview Playground */}
        <section id="playground">
          <InterviewDemo />
        </section>

        {/* 4. Evidence-Backed Readiness Report */}
        <section id="report">
          <ReadinessReport />
        </section>

        {/* 5. High-Conversion Final Call-to-Action */}
        <FinalCTA onOpenStartModal={handleStartPracticing} />
      </main>

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}
