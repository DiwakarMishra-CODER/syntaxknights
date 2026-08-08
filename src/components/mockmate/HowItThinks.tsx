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

/**
 * These describe the pipeline this project actually runs. The earlier
 * copy named a "Semantic Graph Engine", spoken-input parsing and
 * distributed-consensus analysis, none of which exist here — and the real
 * mechanism is more interesting than the invented one.
 */
const FLOW_STEPS: FlowStep[] = [
  {
    id: "plan",
    number: "01",
    title: "Plan",
    shortDesc: "Reads your actual cohort record before asking anything.",
    narrative:
      "Before the first question, it studies what you really did across the 31 days — what you passed first try, what took five attempts, what you skipped entirely — and picks four to six areas worth your hour.",
    badgeColor: "font-mono text-xs font-semibold text-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 rounded-md w-fit inline-block",
    technicalMechanism:
      "One planning call per session. A validator rejects any plan that claims how you performed on a day your record does not cover.",
  },
  {
    id: "ask",
    number: "02",
    title: "Ask",
    shortDesc: "Asks about consequences, not inventory.",
    narrative:
      "Not which library you imported, but what happens to a policy detail split across a chunk boundary. Questions are about the system you built, never the topic in the abstract.",
    badgeColor: "font-mono text-xs font-semibold text-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 rounded-md w-fit inline-block",
    technicalMechanism:
      "Constraints are computed before the model is called and written into the prompt, so the question is composed for the right topic rather than relabelled afterwards.",
  },
  {
    id: "assess",
    number: "03",
    title: "Assess",
    shortDesc: "Scores the answer, then decides the next question from it.",
    narrative:
      "Knowledge, communication and specificity are judged separately — you can explain something clearly and still be describing a textbook rather than your build.",
    badgeColor: "font-mono text-xs font-semibold text-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 rounded-md w-fit inline-block",
    technicalMechanism:
      "Assessment and question generation happen in one pass, so the next question is made of the last answer rather than a script.",
  },
  {
    id: "verify",
    number: "04",
    title: "Verify",
    shortDesc: "Keeps a ledger of what you claimed, in your words.",
    narrative:
      "Every assertion about your system is recorded so later questions can probe it — and so a contradiction three turns apart gets noticed.",
    badgeColor: "font-mono text-xs font-semibold text-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 rounded-md w-fit inline-block",
    technicalMechanism:
      "A claim naming a technical term you never used is dropped before it reaches the ledger. The model does not get to put words in your mouth.",
  },
  {
    id: "adapt",
    number: "05",
    title: "Adapt",
    shortDesc: "Moves between recall and redesign as you go.",
    narrative:
      "A strong answer buys more room on that thread and a harder follow-up. A weak one drops a level and asks something smaller and more concrete — it never piles on.",
    badgeColor: "font-mono text-xs font-semibold text-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 rounded-md w-fit inline-block",
    technicalMechanism:
      "Depth follows a running estimate weighted toward recent answers. Coverage floors and follow-up limits are enforced in code, not left to the model to remember.",
  },
  {
    id: "report",
    number: "06",
    title: "Report",
    shortDesc: "Feedback that quotes you back to yourself. No score.",
    narrative:
      "Strengths and gaps anchored to sentences you actually said, plus something concrete you could do this week on the system you already have.",
    badgeColor: "font-mono text-xs font-semibold text-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 rounded-md w-fit inline-block",
    technicalMechanism:
      "Every quote must appear verbatim in your own words or the report is rejected and rewritten. There is no grade, and no way to infer one.",
  },
];

export const HowItThinks: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const step = FLOW_STEPS[selectedStep];

  return (
    <section id="how-it-works" className="py-24 relative z-10 border-t border-[var(--glass-border)]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="font-mono text-xs font-semibold text-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 rounded-md w-fit inline-block">
            <span>COGNITIVE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-editorial text-[var(--ink-primary)] tracking-tight">
            How MockMate <span className="italic text-[var(--accent-ice-blue)]">Thinks</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--ink-muted)]">
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
                className={`glass rounded-2xl p-5 cursor-pointer text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? "border-[var(--accent-emerald-border)] bg-[var(--accent-emerald-soft)] shadow-xl scale-[1.02]"
                    : "hover:border-[var(--glass-border)] bg-[var(--bg-elevated)]"
                }`}
              >
                {/* Node Number Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isSelected ? "text-[var(--accent-emerald)]" : "text-[var(--ink-muted)]"
                    }`}
                  >
                    {item.number}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)] animate-pulse"></span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[var(--ink-primary)] mb-1 group-hover:text-[var(--accent-emerald)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-[var(--ink-muted)] line-clamp-2">
                  {item.shortDesc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Interactive Storytelling Glass Panel */}
        <div className="glass rounded-3xl p-8 lg:p-12 border border-[var(--glass-border)] bg-[var(--bg-elevated)] shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Story Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)] border border-[var(--accent-emerald-border)] text-xs font-mono font-semibold">
                  PHASE {step.number} • {step.title.toUpperCase()}
                </div>
                <span className="text-xs text-[var(--ink-muted)] font-mono">
                  Adaptive Cognitive Engine
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-editorial text-[var(--ink-primary)] leading-snug">
                {step.title}: <span className="text-[var(--ink-muted)] font-normal">{step.shortDesc}</span>
              </h3>

              <p className="text-base text-[var(--ink-muted)] leading-relaxed font-normal">
                {step.narrative}
              </p>

              {/* Technical Mechanism Box */}
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] font-mono text-xs text-[var(--ink-muted)] space-y-1">
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
                  className="px-4 py-2 rounded-full bg-[var(--bg-elevated)] text-xs font-mono text-[var(--ink-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-30 transition-all"
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
              <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-muted)] border-b border-[var(--glass-border)] pb-3">
                  <span>COGNITIVE LOG TRACE</span>
                  <span className="text-[var(--accent-emerald)]">LIVE EXECUTION</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-[var(--ink-muted)]">
                    <span className="text-[var(--accent-ice-blue)]">&gt; Input Parsed:</span> &ldquo;Scale read replica queries using Redis cache&rdquo;
                  </div>
                  <div className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-[var(--ink-muted)]">
                    <span className="text-[var(--accent-champagne)]">&gt; Detected Blindspot:</span> Cache invalidation strategy under multi-region replication latency
                  </div>
                  <div className="p-2.5 rounded bg-[var(--accent-emerald-soft)] border border-[var(--accent-emerald-border)] text-[var(--ink-primary)]">
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
