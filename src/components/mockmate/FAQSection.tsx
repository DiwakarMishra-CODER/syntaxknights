"use client";

import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: "Platform",
    question: "How is MockMate different from LeetCode or static AI chatbots?",
    answer:
      "Unlike static question banks or generic chatbots, MockMate listens to your full architectural reasoning, retains context across complex multi-step system design questions, and generates natural adaptive follow-ups based on the exact trade-offs you propose.",
  },
  {
    category: "Interviews",
    question: "What technical interview domains are supported?",
    answer:
      "MockMate supports System Design & Distributed Architecture, Backend Engineering & Concurrency, Frontend State Engines & Performance, API Design & Resilience, and Data Engineering Pipelines.",
  },
  {
    category: "Evaluation",
    question: "Does MockMate provide scores or vanity ratings?",
    answer:
      "No. We explicitly avoid vanity scores. MockMate generates an architectural feedback document designed like a staff engineer design review—highlighting trade-off articulation, failure mode awareness, communication clarity, and targeted reading.",
  },
  {
    category: "Teams",
    question: "Can hiring teams or bootcamps use MockMate for candidate calibration?",
    answer:
      "Yes. Our Teams and Institutional plans provide standardized rubrics, cohort progress tracking, and custom interview scenario configuration to calibrate candidate benchmarks objectively.",
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 relative z-10 border-t border-slate-800/60">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="pill-badge pill-badge-emerald">
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-sans text-white tracking-tight">
            Everything You Need <span className="italic text-[var(--accent-emerald)]">To Know</span>
          </h2>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl border border-[var(--glass-border)] bg-slate-900/60 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-white hover:text-[var(--accent-emerald)] transition-colors focus:outline-none"
                >
                  <span className="text-base sm:text-lg">{item.question}</span>
                  <span
                    className={`w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-sm shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-45 text-[var(--accent-emerald)] bg-[var(--accent-emerald-glow)]" : ""
                    }`}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-0 text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 font-normal animate-in fade-in duration-200">
                    <p className="pt-4">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
