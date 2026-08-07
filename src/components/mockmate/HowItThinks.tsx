"use client";

import React, { useState } from "react";

interface FlowStep {
  id: string;
  number: string;
  title: string;
  shortDesc: string;
  narrative: string;
  badgeColor: string;
  technicalMechanism: string;
}

const FLOW_STEPS: FlowStep[] = [
  {
    id: "ask",
    number: "01",
    title: "Ask",
    shortDesc: "Frames context-rich, open-ended engineering prompts.",
    narrative:
      "Instead of firing canned questions, MockMate initiates realistic engineering scenarios tailored to your target role and seniority level.",
    badgeColor: "pill-badge-emerald",
    technicalMechanism:
      "Contextual Prompt Synthesizer evaluates target domain, system constraints, and candidate profile.",
  },
  {
    id: "listen",
    number: "02",
    title: "Listen",
    shortDesc: "Parses spoken and textual trade-off reasoning in real time.",
    narrative:
      "Captures nuances in how you state assumptions, evaluate database trade-offs, and outline system bounds.",
    badgeColor: "pill-badge-ice",
    technicalMechanism:
      "Multi-modal input parser extracts architectural entities, latency bounds, and reliability patterns.",
  },
  {
    id: "understand",
    number: "03",
    title: "Understand",
    shortDesc: "Builds a mental map of candidate mental models and edge cases.",
    narrative:
      "Identifies whether you are designing defensively, considering network partitions, or making unvalidated assumptions.",
    badgeColor: "pill-badge-champagne",
    technicalMechanism:
      "Semantic Graph Engine tracks candidate's proposed topologies and state transitions.",
  },
  {
    id: "reason",
    number: "04",
    title: "Reason",
    shortDesc: "Analyzes system bounds, race conditions, and bottlenecks.",
    narrative:
      "Evaluates your proposed solution against real-world engineering constraints like cache stampedes and single points of failure.",
    badgeColor: "pill-badge-emerald",
    technicalMechanism:
      "Cognitive Trade-Off Analyzer checks solutions against distributed system failure modes.",
  },
  {
    id: "adapt",
    number: "05",
    title: "Adapt",
    shortDesc: "Generates natural follow-ups that challenge your specifics.",
    narrative:
      "Pivots dynamically based on your response—scaling up difficulty if you excel, or offering structured hints if you stall.",
    badgeColor: "pill-badge-ice",
    technicalMechanism:
      "Dynamic Probe Generator formulates tailored follow-up queries that target candidate blind spots.",
  },
  {
    id: "evaluate",
    number: "06",
    title: "Evaluate",
    shortDesc: "Synthesizes multi-dimensional feedback without vanity scores.",
    narrative:
      "Produces executive-level design feedback covering technical depth, communication clarity, and systemic trade-off rigor.",
    badgeColor: "pill-badge-champagne",
    technicalMechanism:
      "Synthesis Review Pipeline generates actionable insights with targeted learning recommendations.",
  },
];

export const HowItThinks: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const step = FLOW_STEPS[selectedStep];

  return (
    <section id="how-it-works" className="py-24 relative z-10 border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="pill-badge pill-badge-emerald">
            <span>COGNITIVE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-editorial text-white tracking-tight">
            How MockMate <span className="italic text-[var(--accent-ice-blue)]">Thinks</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            A continuous glass cognitive loop that listens, reasons, and adapts like a principal staff engineer.
          </p>
        </div>

        {/* Flowing Glass Nodes Process Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {FLOW_STEPS.map((item, index) => {
            const isSelected = selectedStep === index;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedStep(index)}
                className={`glass-panel rounded-2xl p-5 cursor-pointer text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? "border-[var(--accent-emerald-border)] bg-[var(--accent-emerald-glow)] shadow-xl scale-[1.02]"
                    : "hover:border-slate-700 bg-slate-950/40"
                }`}
              >
                {/* Node Number Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isSelected ? "text-[var(--accent-emerald)]" : "text-slate-500"
                    }`}
                  >
                    {item.number}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)] animate-pulse"></span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[var(--accent-emerald)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {item.shortDesc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Interactive Storytelling Glass Panel */}
        <div className="glass-panel rounded-3xl p-8 lg:p-12 border border-[var(--glass-border)] bg-slate-900/80 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Story Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-[var(--accent-emerald-glow)] text-[var(--accent-emerald)] border border-[var(--accent-emerald-border)] text-xs font-mono font-semibold">
                  PHASE {step.number} • {step.title.toUpperCase()}
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Adaptive Cognitive Engine
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-editorial text-white leading-snug">
                {step.title}: <span className="text-slate-300 font-normal">{step.shortDesc}</span>
              </h3>

              <p className="text-base text-slate-300 leading-relaxed font-normal">
                {step.narrative}
              </p>

              {/* Technical Mechanism Box */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1">
                <div className="text-[10px] text-[var(--accent-ice-blue)] font-bold uppercase tracking-wider">
                  UNDERLYING MECHANISM
                </div>
                <div>{step.technicalMechanism}</div>
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  disabled={selectedStep === 0}
                  onClick={() => setSelectedStep((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-full bg-slate-800/80 text-xs font-mono text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-all"
                >
                  ← Previous Phase
                </button>
                <button
                  disabled={selectedStep === FLOW_STEPS.length - 1}
                  onClick={() =>
                    setSelectedStep((prev) =>
                      Math.min(FLOW_STEPS.length - 1, prev + 1)
                    )
                  }
                  className="btn-primary text-xs px-5 py-2"
                >
                  Next Phase →
                </button>
              </div>
            </div>

            {/* Right Visual Diagram Column */}
            <div className="lg:col-span-5 relative">
              <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-3">
                  <span>COGNITIVE LOG TRACE</span>
                  <span className="text-[var(--accent-emerald)]">LIVE EXECUTION</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-300">
                    <span className="text-[var(--accent-ice-blue)]">&gt; Input Parsed:</span> &ldquo;Scale read replica queries using Redis cache&rdquo;
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-300">
                    <span className="text-[var(--accent-champagne)]">&gt; Detected Blindspot:</span> Cache invalidation strategy under multi-region replication latency
                  </div>
                  <div className="p-2.5 rounded bg-[var(--accent-emerald-glow)] border border-[var(--accent-emerald-border)] text-white">
                    <span className="text-[var(--accent-emerald)]">&gt; Generated Probe:</span> &ldquo;How will your cache handle stale reads during DB failover?&rdquo;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
