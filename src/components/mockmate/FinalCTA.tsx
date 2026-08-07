"use client";

import React from "react";

interface FinalCTAProps {
  onOpenStartModal: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenStartModal }) => {
  return (
    <section className="py-28 relative z-10 border-t border-slate-800/50">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="glass-panel rounded-[36px] p-12 sm:p-20 border border-[var(--glass-border)] bg-gradient-to-b from-slate-900/90 to-slate-950/95 text-center relative overflow-hidden shadow-2xl">
          {/* Ambient Lighting */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[var(--accent-emerald)] opacity-15 blur-3xl pointer-events-none"></div>

          <div className="max-w-2xl mx-auto space-y-8 relative z-10">
            <div className="pill-badge pill-badge-emerald">
              <span>GET STARTED</span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-editorial text-white tracking-tight leading-[1.15] text-balance">
              Your next interview <br />
              <span className="italic text-[var(--accent-emerald)]">
                shouldn&apos;t be your first real one.
              </span>
            </h2>

            <div className="pt-4 flex justify-center">
              <button
                onClick={onOpenStartModal}
                className="btn-primary text-base px-10 py-4 shadow-2xl"
              >
                Start Practicing
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
