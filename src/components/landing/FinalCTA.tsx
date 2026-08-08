"use client";

import React from "react";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

interface FinalCTAProps {
  onOpenStartModal: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenStartModal }) => {
  return (
    <section className="relative z-10 overflow-hidden bg-[#050806] py-24 text-[#F5F7F4] lg:py-32">
      
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-16 h-72 w-3xl -translate-x-1/2 rounded-full bg-linear-to-r from-[#1FD16A]/12 via-[#73F0A0]/6 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#1FD16A]/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#101813] px-3.5 py-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#73F0A0]" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[#1FD16A] uppercase">
              Start practicing today
            </span>
          </div>

          <h2 className="text-4xl leading-[1.08] text-[#F5F2EB] sm:text-6xl font-editorial">
            Every other mock interview guesses from your CV. <span className="italic text-[#1FD16A] font-normal">This one knows.</span>
          </h2>

          <p className="text-base font-light leading-relaxed text-[#CFD7D0] sm:text-lg">
            Start with Tyler’s recorded session or open the modal and choose another candidate. The point is the same: a real interview, not a generic practice flow.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
            <button onClick={onOpenStartModal} className="btn-pill-amber text-base px-8 py-3.5">
              Start practice interview
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <a href="#comparison" className="btn-pill-secondary flex items-center gap-2 px-6 py-3.5 text-base">
              See the divergence
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-[#8B968F] font-sans">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#73F0A0]" />
              No credit card required
            </span>
            <span>Recorded replay</span>
            <span>Real interview logic</span>
          </div>

        </div>
      </div>
    </section>
  );
};
