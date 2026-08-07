"use client";

import React from "react";

interface ActionableReportProps {
  onOpenReportModal: () => void;
}

export const ActionableReport: React.FC<ActionableReportProps> = ({
  onOpenReportModal,
}) => {
  return (
    <section id="dossier" className="py-28 relative z-10 border-t border-slate-800/50">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="pill-badge pill-badge-emerald">
            <span>THE ARCHITECTURAL DOSSIER</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-editorial text-white tracking-tight">
            Leave knowing <span className="italic text-[var(--accent-emerald)]">what to improve.</span>
          </h2>
          <p className="text-base text-slate-300 font-light">
            No vanity scores or arbitrary percentages. MockMate produces an executive staff-engineer review focused strictly on architectural depth.
          </p>
        </div>

        {/* One Elegant Report Panel */}
        <div className="glass-panel rounded-[32px] p-8 sm:p-12 border border-[var(--glass-border)] bg-slate-900/80 shadow-2xl relative overflow-hidden text-left">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono text-[var(--accent-emerald)] font-semibold uppercase tracking-widest mb-1">
                STAFF DESIGN REVIEW
              </div>
              <h3 className="text-2xl font-editorial text-white">
                Senior Distributed Systems Evaluation
              </h3>
            </div>

            <button
              onClick={onOpenReportModal}
              className="btn-primary text-xs px-5 py-2.5 shrink-0"
            >
              View Full Sample Dossier
            </button>
          </div>

          {/* Report Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Timeline */}
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>CONVERSATION TIMELINE</span>
                  <span className="text-[var(--accent-emerald)]">45 MIN</span>
                </div>
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">00:00 • SLA Bounds Setup</span>
                    <span className="text-[var(--accent-emerald)] font-bold">Strong</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">15:30 • Distributed Locking & Raft</span>
                    <span className="text-[var(--accent-ice-blue)] font-bold">Detailed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">32:00 • Cache Stampede Mitigation</span>
                    <span className="text-[var(--accent-champagne)] font-bold">Refinement</span>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div className="p-6 rounded-2xl bg-emerald-950/20 border border-[var(--accent-emerald-border)] space-y-2">
                <div className="text-xs font-mono text-[var(--accent-emerald)] font-bold uppercase tracking-wider">
                  KEY ARCHITECTURAL STRENGTHS
                </div>
                <ul className="text-xs text-slate-200 space-y-2 list-disc list-inside font-light">
                  <li>Identified network partition risks early during topology setup.</li>
                  <li>Articulated clear trade-offs between linearizability vs eventual consistency.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              {/* Refinement */}
              <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="text-xs font-mono text-[var(--accent-champagne)] font-bold uppercase tracking-wider">
                  TARGETED REFINEMENT
                </div>
                <ul className="text-xs text-slate-200 space-y-2 list-disc list-inside font-light">
                  <li>Over-indexed on Redis cache layer before evaluating database write queues.</li>
                  <li>Could deepen memory safety guarantees under lock-free queues.</li>
                </ul>
              </div>

              {/* Recommendation Panel */}
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="text-xs font-mono text-[var(--accent-ice-blue)] font-bold uppercase tracking-wider">
                  RECOMMENDED READING
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs text-slate-300">
                  <span>Designing Data-Intensive Applications (Ch. 8)</span>
                  <span className="text-[var(--accent-emerald)] font-mono">Chapter 8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
