"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { AdaptiveFlow } from "@/components/landing/AdaptiveFlow";
import { InterviewDemo } from "@/components/landing/InterviewDemo";
import { ReadinessReport } from "@/components/landing/ReadinessReport";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { StartInterviewModal } from "@/components/mockmate/Modals";

export default function Home() {
  const [startModalOpen, setStartModalOpen] = useState(false);

  const handleStartPracticing = () => {
    setStartModalOpen(true);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050806] text-[#F5F7F4] selection:bg-[#1FD16A]/25 selection:text-[#1FD16A]">
      {/* Navbar */}
      <Navbar onOpenStartModal={handleStartPracticing} />

      {/* Continuous Page Flow */}
      <main className="relative z-10 space-y-0">
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

      {/* Interactive Session Calibration Modal */}
      <StartInterviewModal
        isOpen={startModalOpen}
        onClose={() => setStartModalOpen(false)}
      />
    </div>
  );
}
