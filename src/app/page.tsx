"use client";

import React, { useState } from "react";
import { Preloader } from "@/components/mockmate/Preloader";
import { Header } from "@/components/mockmate/Header";
import { Hero } from "@/components/mockmate/Hero";
import { ProductShowcase } from "@/components/mockmate/ProductShowcase";
import { WhyDifferent } from "@/components/mockmate/WhyDifferent";
import { PhilosophyQuote } from "@/components/mockmate/PhilosophyQuote";
import { ProductMoments } from "@/components/mockmate/ProductMoments";
import { ActionableReport } from "@/components/mockmate/ActionableReport";
import { FinalCTA } from "@/components/mockmate/FinalCTA";
import { Footer } from "@/components/mockmate/Footer";
import {
  StartInterviewModal,
  WatchDemoModal,
  SampleReportModal,
} from "@/components/mockmate/Modals";

export default function Home() {
  const [preloaderComplete, setPreloaderComplete] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent-emerald-glow)] selection:text-[var(--accent-emerald)] overflow-x-hidden">
      {/* 1-Second Product Introduction Preloader */}
      {!preloaderComplete && (
        <Preloader onComplete={() => setPreloaderComplete(true)} />
      )}

      {/* Corner Ambient Edge Auroras */}
      <div className="aurora-bg">
        <div className="aurora-top-left" />
        <div className="aurora-top-right" />
        <div className="aurora-bottom-left" />
        <div className="aurora-bottom-right" />
      </div>

      {/* Semantic Floating Glass Navbar */}
      <Header onOpenStartModal={() => setStartModalOpen(true)} />

      {/* Semantic Main Content Flow */}
      <main className="relative z-10">
        {/* Section 1: Hero Thesis Statement */}
        <Hero onOpenStartModal={() => setStartModalOpen(true)} />

        {/* Section 2: Full-Width Glass Interview Room Showcase */}
        <ProductShowcase />

        {/* Section 3: One Striking Comparison */}
        <WhyDifferent />

        {/* Section 4: Core Philosophy Quote */}
        <PhilosophyQuote />

        {/* Section 5: Three Human Product Moments (Keeps Context, Challenges Assumptions, Knows When To Push) */}
        <ProductMoments />

        {/* Section 6: Actionable Staff Design Review Dossier */}
        <ActionableReport
          onOpenReportModal={() => setReportModalOpen(true)}
        />

        {/* Section 7: Final Product Launch Call To Action */}
        <FinalCTA onOpenStartModal={() => setStartModalOpen(true)} />
      </main>

      {/* Semantic Footer */}
      <Footer />

      {/* Interactive Modals */}
      <StartInterviewModal
        isOpen={startModalOpen}
        onClose={() => setStartModalOpen(false)}
      />
      <WatchDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
      <SampleReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
}
