"use client";

import React from "react";

interface Moment {
  number: string;
  title: string;
  statement: string;
  detail: string;
  accentColor: string;
}

const MOMENTS: Moment[] = [
  {
    number: "01",
    title: "Keeps Context",
    statement: "Never loses the thread.",
    detail: "MockMate retains your entire architectural framework across multi-step system design questions.",
    accentColor: "var(--accent-emerald)",
  },
  {
    number: "02",
    title: "Challenges Assumptions",
    statement: "Probes unvalidated trade-offs.",
    detail: "Identifies when you rely on unstated database guarantees or bypass write-queue bottlenecks.",
    accentColor: "var(--accent-ice-blue)",
  },
  {
    number: "03",
    title: "Knows When To Push",
    statement: "Scales depth in real time.",
    detail: "Pivots seamlessly into Raft consensus, memory barriers, and split-brain recovery when you demonstrate mastery.",
    accentColor: "var(--accent-champagne)",
  },
];

export const ProductMoments: React.FC = () => {
  return (
    <section className="py-28 relative z-10 border-t border-slate-800/50">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="pill-badge pill-badge-emerald">
            <span>PRODUCT MOMENTS</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-editorial text-white tracking-tight">
            How intelligence <span className="italic text-[var(--accent-emerald)]">behaves</span>
          </h2>
        </div>

        {/* 3 Human Moments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {MOMENTS.map((m, i) => (
            <div
              key={i}
              className="glass-panel rounded-3xl p-8 border border-[var(--glass-border)] bg-slate-900/60 flex flex-col justify-between space-y-6 hover:bg-slate-900/90 transition-all"
            >
              <div className="space-y-3">
                <div
                  className="text-xs font-mono font-bold tracking-widest uppercase"
                  style={{ color: m.accentColor }}
                >
                  MOMENT {m.number}
                </div>
                <h3 className="text-2xl font-editorial text-white">
                  {m.title}
                </h3>
                <div className="text-sm font-semibold text-slate-200">
                  {m.statement}
                </div>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  {m.detail}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                Cognitive Behavior {m.number}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
