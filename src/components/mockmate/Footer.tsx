"use client";

import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="py-14 border-t border-slate-800/60 relative z-10 bg-slate-950/90 text-left text-xs text-slate-400">
      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent-emerald)] to-[#10B981] flex items-center justify-center font-bold text-[#0B1220] text-xs">
              M
            </div>
            <span className="text-base font-bold text-white font-sans">
              Mock<span className="text-[var(--accent-emerald)] font-light">Mate</span>
            </span>
          </div>

          <div className="flex items-center gap-8 font-mono text-xs text-slate-400">
            <a href="#showcase" className="hover:text-[var(--accent-emerald)] transition-colors">
              Showcase
            </a>
            <a href="#difference" className="hover:text-[var(--accent-emerald)] transition-colors">
              Difference
            </a>
            <a href="#dossier" className="hover:text-[var(--accent-emerald)] transition-colors">
              Dossier
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} MockMate Inc. Designed by engineers for engineers.
          </div>
          <div className="flex items-center gap-3">
            <span>VisionOS Glass</span>
            <span>•</span>
            <span>8px Baseline Grid</span>
            <span>•</span>
            <span>Zero SaaS Noise</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
