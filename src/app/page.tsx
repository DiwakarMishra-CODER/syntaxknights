"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/mockmate/Header";
import { Hero } from "@/components/mockmate/Hero";
import { ProductShowcase } from "@/components/mockmate/ProductShowcase";
import { WhyDifferent } from "@/components/mockmate/WhyDifferent";
import { PhilosophyQuote } from "@/components/mockmate/PhilosophyQuote";
import { ProductMoments } from "@/components/mockmate/ProductMoments";
import { HowItThinks } from "@/components/mockmate/HowItThinks";
import { ActionableReport } from "@/components/mockmate/ActionableReport";
import { FinalCTA } from "@/components/mockmate/FinalCTA";
import { Footer } from "@/components/mockmate/Footer";
import { StartInterviewModal } from "@/components/mockmate/Modals";
import { AuroraBackground } from "@/components/mockmate/AuroraBackground";

export default function Home() {
  const [startModalOpen, setStartModalOpen] = useState(false);
  const router = useRouter();

  // Straight into the live interview. The calibration modal it used to open
  // ends in a fake "Configuring Adaptive Session" screen and never reaches
  // the API — the interview is planned from a real cohort record.
  const handleStartPracticing = () => router.push("/interview");

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--ink-primary)] selection:bg-[var(--accent-emerald-soft)] selection:text-[var(--accent-emerald)] overflow-x-hidden">
      {/* Background Washes */}
      <AuroraBackground />

      {/* Floating Glass Navigation */}
      <Header onOpenStartModal={handleStartPracticing} />

      {/* Main Layout Flow (Max 6 Primary Sections) */}
      <main className="relative z-10">
        {/* Section 1: Hero */}
        <Hero onOpenStartModal={handleStartPracticing} />

        {/* Section 1 Signature Element: Live Dialogue Demo Panel */}
        <ProductShowcase />

        {/* Section 2: Contrast */}
        <WhyDifferent />

        {/* Section 3: How the engine actually works */}
        <HowItThinks />

        {/* Section 4: Core Philosophy Quote */}
        <PhilosophyQuote />

        {/* Section 5: Behavior Cards */}
        <ProductMoments />

        {/* Section 6: Evaluation Dossier */}
        <ActionableReport />

        {/* Section 7: Final CTA */}
        <FinalCTA onOpenStartModal={handleStartPracticing} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Session Calibration Modal */}
      <StartInterviewModal
        isOpen={startModalOpen}
        onClose={() => setStartModalOpen(false)}
      />
    </div>
  );
}
