"use client";

import React from "react";

interface HeroProps {
  onOpenStartModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenStartModal }) => {
  return (
    <section className="relative pt-44 pb-20 md:pt-56 md:pb-28 overflow-hidden text-center">
      <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10 space-y-8">
        {/* Subtle Tag */}
        <div className="stagger-1 inline-flex">
          <div className="pill-badge pill-badge-emerald">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)] pulse-ring"></span>
            <span>ADAPTIVE INTERVIEW PLATFORM</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="stagger-2 text-5xl sm:text-7xl lg:text-8xl font-editorial tracking-tight text-white leading-[1.05] text-balance">
          Practice Against <br />
          <span className="italic font-light text-[var(--accent-emerald)]">
            Intelligence.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="stagger-3 text-lg sm:text-xl md:text-2xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto text-balance">
          MockMate doesn&apos;t ask better questions. <br className="hidden sm:inline" />
          It asks better follow-up questions.
        </p>

        {/* Single Primary CTA */}
        <div className="pt-4 flex justify-center stagger-3">
          <button
            onClick={onOpenStartModal}
            className="btn-primary text-base px-10 py-4 shadow-2xl hover:scale-105 transition-transform"
          >
            Start Practicing
          </button>
        </div>

        {/* Multi-Hued Corner Ambient Backlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-[var(--accent-emerald)] opacity-12 blur-[140px] pointer-events-none rounded-full"></div>
      </div>
    </section>
  );
};
