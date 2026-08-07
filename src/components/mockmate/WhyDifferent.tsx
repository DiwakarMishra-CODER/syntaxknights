"use client";

import React from "react";

export const WhyDifferent: React.FC = () => {
  return (
    <section id="difference" className="py-28 relative z-10 border-t border-slate-800/50">
      <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="pill-badge pill-badge-ice">
            <span>THE CONTRAST</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-editorial text-white tracking-tight leading-tight">
            Not another <span className="italic text-[var(--accent-ice-blue)]">question bank.</span>
          </h2>
        </div>

        {/* One Premium Comparison Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch text-left">
          {/* Traditional */}
          <div className="glass-panel glass-shine-card rounded-3xl p-8 border-rose-500/20 bg-slate-950/40 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-mono text-rose-400 uppercase tracking-widest font-semibold">
                TRADITIONAL PREP
              </div>
              <h3 className="text-2xl font-editorial text-slate-400">
                Static Questions
              </h3>
              <p className="text-slate-400 text-sm font-light leading-relaxed">
                Asks everyone the same linear question list. Searches for exact keywords regardless of architectural context.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-900 flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="text-rose-400">Same questions</span>
              <span>→</span>
              <span className="text-rose-400">Same ending</span>
            </div>
          </div>

          {/* MockMate */}
          <div className="glass-panel glass-shine-card rounded-3xl p-8 border-[var(--accent-emerald-border)] bg-slate-900/80 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-[var(--accent-emerald-glow)] text-[var(--accent-emerald)] text-[10px] font-mono rounded-bl-xl border-l border-b border-[var(--accent-emerald-border)]">
              MOCKMATE
            </div>

            <div className="space-y-3">
              <div className="text-xs font-mono text-[var(--accent-emerald)] uppercase tracking-widest font-semibold">
                MOCKMATE ENGINE
              </div>
              <h3 className="text-2xl font-editorial text-white">
                Adaptive Dialogue
              </h3>
              <p className="text-slate-200 text-sm font-light leading-relaxed">
                Listens to your trade-offs, understands your system bounds, and generates adaptive follow-up probes in real time.
              </p>
            </div>

            <div className="pt-4 border-t border-emerald-500/20 flex items-center gap-2 text-xs font-mono text-[var(--accent-emerald)] font-bold">
              <span>Conversation</span>
              <span>→</span>
              <span>Reasoning</span>
              <span>→</span>
              <span>Adaptive follow-ups</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
