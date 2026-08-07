"use client";

import React, { useState, useEffect } from "react";

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // 1-second rapid product introduction sequence
    const t1 = setTimeout(() => setStepIndex(1), 250);
    const t2 = setTimeout(() => setStepIndex(2), 500);
    const t3 = setTimeout(() => setStepIndex(3), 750);
    const t4 = setTimeout(() => {
      setFadingOut(true);
    }, 950);

    const t5 = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0B1220] transition-opacity duration-300 ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="glass-panel rounded-3xl p-8 max-w-sm w-full border border-[var(--glass-border)] bg-slate-900/90 shadow-2xl text-left space-y-4">
        {/* Top Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)] animate-pulse"></span>
            <span>MOCKMATE ENGINE</span>
          </div>
          <span>v2.4</span>
        </div>

        {/* Dynamic Product Intro Steps */}
        <div className="space-y-3 font-mono text-xs">
          {stepIndex >= 0 && (
            <div className="text-slate-300 flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-[var(--accent-emerald)]">Interviewer:</span> &ldquo;Let&apos;s begin.&rdquo;
            </div>
          )}

          {stepIndex >= 1 && (
            <div className="text-slate-400 flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-slate-500">Candidate:</span> &ldquo;...&rdquo;
            </div>
          )}

          {stepIndex >= 2 && (
            <div className="text-[var(--accent-ice-blue)] flex items-center gap-2 animate-in fade-in duration-150">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-ice-blue)] animate-ping"></span>
              <span>Thinking...</span>
            </div>
          )}

          {stepIndex >= 3 && (
            <div className="text-[var(--accent-emerald)] font-bold flex items-center gap-2 animate-in fade-in duration-150 pt-1 border-t border-slate-800">
              <span>✓ Question generated.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
