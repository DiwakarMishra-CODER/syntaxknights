"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { AdaptiveFlow } from "@/components/landing/AdaptiveFlow";
import { InterviewDemo } from "@/components/landing/InterviewDemo";
import { ReadinessReport } from "@/components/landing/ReadinessReport";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { StartInterviewModal } from "@/components/mockmate/Modals";
import { Preloader } from "@/components/mockmate/Preloader";

export default function Home() {
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [showPreloader, setShowPreloader] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Only show preloader if not already shown in this session
    const alreadyShown =
      typeof window !== "undefined" &&
      Boolean(
        (window as any).__MOCKMATE_LOADED__ ||
        sessionStorage.getItem("mockmate_preloader_shown") === "true"
      );

    if (!alreadyShown) {
      setShowPreloader(true);
    }
  }, []);

  const handleStartPracticing = () => router.push("/dashboard");

  const handlePreloaderComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      (window as any).__MOCKMATE_LOADED__ = true;
      try {
        sessionStorage.setItem("mockmate_preloader_shown", "true");
      } catch {
        // ignore
      }
    }
    setShowPreloader(false);
  }, []);

  return (
    <>
      {/* Preloader overlay - only rendered on the very first visit */}
      {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Main page content - always visible under preloader */}
      <div className="relative min-h-screen overflow-x-hidden selection:bg-[#1FD16A]/25 selection:text-[#1FD16A]">
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
    </>
  );
}
