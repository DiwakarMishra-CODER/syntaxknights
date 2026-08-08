"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScenarioStep {
  topic: string;
  interviewer: string;
  candidate: string;
  thinkingText: string;
  followUp: string;
}

const SCENARIOS: ScenarioStep[] = [
  {
    topic: "System Architecture",
    interviewer:
      "If our global payment gateway experiences a 10x traffic spike, how would you prevent cascading failures in downstream auth services?",
    candidate:
      "I'd place a token-bucket rate limiter at the edge backed by Redis for multi-region coordination, and introduce exponential backoff on client retries.",
    thinkingText: "Analyzing trade-offs • Evaluating Redis concurrency limits under partition...",
    followUp:
      "If the central Redis cluster experiences a 200ms network partition, how does your rate limiter fail gracefully without dropping valid payments?",
  },
  {
    topic: "Distributed Consensus",
    interviewer:
      "In Raft consensus, what happens when two candidate nodes request votes simultaneously in the exact same term?",
    candidate:
      "A split vote occurs. Neither candidate gets a majority, so the term times out and a new election starts with randomized election timeouts.",
    thinkingText: "Evaluating log replication bounds • Probing safety guarantees...",
    followUp:
      "How does Raft guarantee that a newly elected leader contains all previously committed log entries without requiring log repair during elections?",
  },
  {
    topic: "Async Concurrency",
    interviewer:
      "How do atomic compare-and-swap (CAS) operations prevent race conditions in a lock-free queue, and what is the ABA problem?",
    candidate:
      "CAS updates a pointer only if it matches expected value. ABA occurs when value changes from A to B back to A, tricking CAS despite underlying memory shifts.",
    thinkingText: "Probing memory barriers • Evaluating hazard pointer trade-offs...",
    followUp:
      "How would you implement hazard pointers or generational memory tagging to eliminate ABA overhead in a high-throughput C++ queue?",
  },
];

export const ProductShowcase: React.FC = () => {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "typing" | "thinking" | "followup">("idle");
  const [displayedFollowUp, setDisplayedFollowUp] = useState("");

  const currentStep = SCENARIOS[activeTabIdx];

  // Conversation motion auto-plays ~500ms after load or tab switch
  useEffect(() => {
    setPhase("idle");
    setDisplayedFollowUp("");

    const t1 = setTimeout(() => {
      setPhase("thinking");
    }, 500);

    const t2 = setTimeout(() => {
      setPhase("typing");
    }, 1200);

    const t3 = setTimeout(() => {
      setPhase("followup");
      let charIdx = 0;
      const text = currentStep.followUp;
      const interval = setInterval(() => {
        if (charIdx <= text.length) {
          setDisplayedFollowUp(text.slice(0, charIdx));
          charIdx += 3;
        } else {
          clearInterval(interval);
        }
      }, 25);
      return () => clearInterval(interval);
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeTabIdx, currentStep]);

  return (
    <section id="showcase" className="pb-24 pt-4 relative z-10">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        
        {/* Signature Live Demo Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass glass-hover p-6 sm:p-10 rounded-2xl text-left"
        >
          {/* Top Bar with Shadcn Tabs & Emerald Sliding Indicator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[var(--glass-border)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)]"></span>
              <span className="text-xs font-mono text-[var(--ink-muted)] uppercase tracking-wider">
                Live Dialogue Sequence
              </span>
            </div>

            {/* Sliding Tab Bar */}
            <div className="flex items-center bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--glass-border)]">
              {SCENARIOS.map((sc, idx) => (
                <button
                  key={sc.topic}
                  onClick={() => setActiveTabIdx(idx)}
                  className={cn(
                    "relative px-3.5 py-1.5 text-xs font-mono rounded-lg transition-colors z-10",
                    activeTabIdx === idx ? "text-[var(--btn-primary-text)] font-medium" : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  )}
                >
                  {activeTabIdx === idx && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-[var(--accent-emerald)] rounded-lg -z-10 shadow-sm"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  {sc.topic}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Exchange */}
          <div className="space-y-6">
            {/* Interviewer Question */}
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="w-8 h-8 rounded-lg bg-[var(--ink-primary)] text-[var(--bg-base)] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                M
              </div>
              <div className="bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-2xl p-5 text-sm sm:text-base text-[var(--ink-primary)] leading-relaxed shadow-sm">
                <div className="text-[11px] font-mono text-[var(--accent-emerald)] mb-1 font-semibold uppercase tracking-wider">
                  MockMate
                </div>
                {currentStep.interviewer}
              </div>
            </div>

            {/* Candidate Response */}
            <div className="flex items-start gap-3.5 justify-end pl-6">
              <div className="bg-[var(--bg-base)] border border-[var(--glass-border)] rounded-2xl p-5 text-sm sm:text-base text-[var(--ink-primary)] leading-relaxed shadow-sm max-w-3xl">
                <div className="text-[11px] font-mono text-[var(--ink-muted)] mb-1 font-semibold uppercase tracking-wider text-right">
                  Candidate Response
                </div>
                {currentStep.candidate}
              </div>
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-[var(--accent-emerald)]/20">
                C
              </div>
            </div>

            {/* Single Line Telemetry / Thinking Readout */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-xs font-mono text-[var(--ink-muted)] w-fit shadow-xs">
              {phase === "thinking" || phase === "typing" ? (
                <>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)] animate-pulse"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)] animate-pulse delay-150"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)] animate-pulse delay-300"></span>
                  </div>
                  <span className="text-[var(--accent-emerald)] font-medium">
                    {currentStep.thinkingText}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)]"></span>
                  <span>{currentStep.thinkingText}</span>
                </>
              )}
            </div>

            {/* Adaptive Follow-up Probe */}
            <div
              className={cn(
                "flex items-start gap-3.5 max-w-3xl transition-opacity duration-500",
                phase === "followup" || displayedFollowUp.length > 0 ? "opacity-100" : "opacity-0"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-emerald)] text-[var(--btn-primary-text)] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                M
              </div>
              <div className="bg-[var(--bg-elevated)] border border-[var(--accent-emerald)]/40 rounded-2xl p-5 text-sm sm:text-base text-[var(--ink-primary)] leading-relaxed shadow-sm relative">
                <div className="text-[11px] font-mono text-[var(--accent-emerald)] mb-1 font-semibold uppercase tracking-wider">
                  Adaptive Follow-up
                </div>
                {displayedFollowUp}
                {displayedFollowUp.length > 0 && displayedFollowUp.length < currentStep.followUp.length && (
                  <span className="inline-block w-1.5 h-3.5 bg-[var(--accent-emerald)] animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
