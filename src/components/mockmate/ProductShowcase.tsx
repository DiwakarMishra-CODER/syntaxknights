"use client";

import React, { useState, useEffect } from "react";

interface Step {
  interviewer: string;
  candidate: string;
  thinking: string;
  followUp: string;
  topicTag: string;
}

const SHOWCASE_SCENARIOS: Record<string, Step[]> = {
  "System Architecture": [
    {
      topicTag: "Distributed Systems • Resilience",
      interviewer:
        "If our global payment gateway experiences a 10x traffic spike, how would you prevent cascading failures in downstream auth services?",
      candidate:
        "I'd place a token-bucket rate limiter at the edge, backed by Redis for multi-region coordination, and introduce exponential backoff with jitter on client retries.",
      thinking:
        "Analyzing trade-offs • Identified Redis dependency risks under high concurrency...",
      followUp:
        "Good. But if the central Redis cluster experiences a 200ms network partition, how does your rate limiter fail gracefully without dropping payment requests?",
    },
    {
      topicTag: "Storage Partitioning • Failover",
      interviewer:
        "How would your circuit breaker handle state transitions when 30% of database queries time out?",
      candidate:
        "I'd use a sliding window metrics stream to track error rates. When error rate exceeds 25%, transition to Half-Open to test canary probes.",
      thinking:
        "Evaluating reasoning depth • Verifying probe isolation during partial failover...",
      followUp:
        "What happens if your canary probes succeed, but the database primary is still undergoing failover replication?",
    },
  ],
  "Distributed Consensus": [
    {
      topicTag: "Raft Protocol • Leader Election",
      interviewer:
        "In Raft consensus, what happens when two candidate nodes request votes simultaneously in the exact same term?",
      candidate:
        "Split vote occurs. Neither candidate gets a majority, so the term times out and a new election starts with randomized election timeouts to break the tie.",
      thinking:
        "Evaluating clarity • Candidate correctly articulated split vote mechanics. Probing log replication safety...",
      followUp:
        "How does Raft guarantee that a newly elected leader contains all previously committed log entries without requiring log repair during elections?",
    },
  ],
  "Async Concurrency": [
    {
      topicTag: "Memory Barriers • ABA Problem",
      interviewer:
        "How do atomic compare-and-swap (CAS) operations prevent race conditions in a lock-free queue, and what is the ABA problem?",
      candidate:
        "CAS updates a pointer only if it matches expected value. ABA occurs when value changes from A to B back to A, tricking CAS into succeeding despite underlying memory shifts.",
      thinking:
        "Evaluating technical depth • Identified memory recycling risks. Probing hardware hazard pointers...",
      followUp:
        "How would you implement hazard pointers or generational memory tagging to eliminate ABA overhead in a high-throughput C++ queue?",
    },
  ],
};

export const ProductShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("System Architecture");
  const [stepIndex, setStepIndex] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [displayedFollowUp, setDisplayedFollowUp] = useState("");

  const scenarioSteps = SHOWCASE_SCENARIOS[activeTab];
  const currentStep = scenarioSteps[stepIndex] || scenarioSteps[0];

  // Animated text reveal for follow-up
  useEffect(() => {
    setIsThinking(true);
    setDisplayedFollowUp("");

    const timer = setTimeout(() => {
      setIsThinking(false);
      let charIdx = 0;
      const text = currentStep.followUp;
      const interval = setInterval(() => {
        if (charIdx <= text.length) {
          setDisplayedFollowUp(text.slice(0, charIdx));
          charIdx += 3;
        } else {
          clearInterval(interval);
        }
      }, 20);
      return () => clearInterval(interval);
    }, 600);

    return () => clearTimeout(timer);
  }, [activeTab, stepIndex, currentStep]);

  return (
    <section id="showcase" className="py-20 relative z-10">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        {/* Full-width Glass Conversation Showcase */}
        <div className="glass-panel glass-shine-card rounded-[32px] p-6 sm:p-12 border border-[var(--glass-border)] bg-slate-900/70 shadow-2xl relative overflow-hidden text-left transition-transform duration-500 hover:scale-[1.01]">
          {/* Ambient Edge Auroras */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[var(--accent-emerald)] opacity-20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[var(--accent-ice-blue)] opacity-20 blur-3xl pointer-events-none"></div>

          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800/80 relative z-10">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[var(--accent-emerald)] pulse-ring"></span>
              <span className="text-xs font-mono text-slate-300 uppercase tracking-widest font-semibold">
                THE INTERVIEW • {currentStep.topicTag}
              </span>
            </div>

            {/* Topic Controls */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {Object.keys(SHOWCASE_SCENARIOS).map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setActiveTab(topic);
                    setStepIndex(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    activeTab === topic
                      ? "bg-[var(--accent-emerald-glow)] text-[var(--accent-emerald)] border border-[var(--accent-emerald-border)] font-bold shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {topic.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="space-y-6 relative z-10">
            {/* Interviewer Question */}
            <div className="flex items-start gap-4 max-w-3xl animate-in fade-in slide-in-from-left-3 duration-500">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-[var(--accent-emerald)] shrink-0 shadow-md relative">
                M
                <span className="absolute inset-0 rounded-2xl bg-[var(--accent-emerald)] opacity-40 pulse-ring"></span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 text-base sm:text-lg text-slate-100 leading-relaxed shadow-sm font-light">
                <div className="text-[11px] font-mono text-[var(--accent-emerald)] mb-1 font-semibold uppercase tracking-wider">
                  MockMate
                </div>
                {currentStep.interviewer}
              </div>
            </div>

            {/* Candidate Response */}
            <div className="flex items-start gap-4 justify-end pl-8 animate-in fade-in slide-in-from-right-3 duration-600">
              <div className="bg-[var(--accent-emerald-glow)] border border-[var(--accent-emerald-border)] rounded-3xl p-6 text-base sm:text-lg text-slate-100 leading-relaxed shadow-sm font-light max-w-3xl">
                <div className="text-[11px] font-mono text-[var(--accent-emerald)] mb-1 font-semibold uppercase tracking-wider text-right">
                  Candidate
                </div>
                {currentStep.candidate}
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-[var(--accent-emerald-border)] flex items-center justify-center font-bold text-white text-sm shrink-0">
                A
              </div>
            </div>

            {/* Thinking Indicator */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-300">
              <span
                className={`w-2.5 h-2.5 rounded-full bg-[var(--accent-ice-blue)] ${
                  isThinking ? "animate-ping" : "animate-pulse"
                }`}
              ></span>
              <span className="text-[var(--accent-ice-blue)]">
                {isThinking
                  ? "Evaluating reasoning depth & trade-offs..."
                  : currentStep.thinking}
              </span>
            </div>

            {/* Adaptive Follow-up with Animated Typing */}
            <div className="flex items-start gap-4 max-w-3xl animate-in fade-in slide-in-from-bottom-3 duration-700">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--accent-emerald)] to-emerald-600 flex items-center justify-center font-bold text-[#0B1220] text-sm shrink-0 shadow-lg relative">
                M
                <span className="absolute inset-0 rounded-2xl bg-[var(--accent-emerald)] opacity-30 pulse-ring"></span>
              </div>
              <div className="bg-slate-950/90 border border-[var(--accent-ice-blue-border)] rounded-3xl p-6 text-base sm:text-lg text-white leading-relaxed shadow-xl relative overflow-hidden">
                <div className="text-[11px] font-mono text-[var(--accent-ice-blue)] mb-1 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>MockMate • Adaptive Follow-up</span>
                  <span className="text-[10px] bg-[var(--accent-ice-blue-glow)] px-2 py-0.5 rounded text-[var(--accent-ice-blue)] border border-[var(--accent-ice-blue-border)]">
                    REASONING PROBE
                  </span>
                </div>
                {displayedFollowUp}
                {displayedFollowUp.length < currentStep.followUp.length && (
                  <span className="inline-block w-2 h-4 bg-[var(--accent-ice-blue)] animate-pulse ml-1"></span>
                )}
              </div>
            </div>
          </div>

          {/* Replay Controls */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400 relative z-10">
            <span>
              Sequence {stepIndex + 1} of {scenarioSteps.length}
            </span>
            <div className="flex items-center gap-3">
              <button
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 disabled:opacity-30 text-slate-300 transition-colors"
              >
                ← Prev
              </button>
              <button
                disabled={stepIndex === scenarioSteps.length - 1}
                onClick={() =>
                  setStepIndex((prev) =>
                    Math.min(scenarioSteps.length - 1, prev + 1)
                  )
                }
                className="px-4 py-2 rounded-xl bg-[var(--accent-emerald-glow)] text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald-border)] transition-colors border border-[var(--accent-emerald-border)] font-bold shadow-md hover:scale-105"
              >
                Next Sequence →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
