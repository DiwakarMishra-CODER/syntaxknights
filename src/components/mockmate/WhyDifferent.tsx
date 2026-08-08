"use client";

import React from "react";
import { motion } from "framer-motion";

export const WhyDifferent: React.FC = () => {
  return (
    <section id="difference" className="py-20 relative z-10 border-t border-[var(--glass-border)]">
      <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-2 max-w-xl mx-auto"
        >
          <span className="text-xs font-mono text-[var(--accent-ice)] uppercase tracking-wider font-semibold">
            Contrast
          </span>
          <h2 className="text-3xl sm:text-4xl font-sans text-[var(--ink-primary)] tracking-tight">
            Not another <span className="italic font-normal">question bank.</span>
          </h2>
        </motion.div>

        {/* 2-Column Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch text-left">
          {/* Static Prep */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-2xl p-8 flex flex-col justify-between space-y-6 opacity-85">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-rose)]"></span>
                  <span className="text-xs font-mono text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
                    Static Prep
                  </span>
                </div>
                <h3 className="text-xl font-sans text-[var(--ink-primary)]">
                  Linear Question Lists
                </h3>
                <p className="text-[var(--ink-muted)] text-sm font-normal leading-relaxed">
                  Asks everyone the exact same question order. Searches for keyword matches regardless of architectural context or trade-off reasoning.
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--glass-border)] text-xs font-mono text-[var(--ink-muted)]">
                Fixed script → Fixed feedback
              </div>
            </div>
          </motion.div>

          {/* MockMate Engine */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="h-full glass glass-hover p-8 rounded-2xl flex flex-col justify-between space-y-6 border-[var(--accent-emerald)]/40">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)]"></span>
                  <span className="text-xs font-mono text-[var(--accent-emerald)] uppercase tracking-wider font-semibold">
                    MockMate Engine
                  </span>
                </div>
                <h3 className="text-xl font-sans text-[var(--ink-primary)]">
                  Adaptive Dialogue
                </h3>
                <p className="text-[var(--ink-muted)] text-sm font-normal leading-relaxed">
                  Listens to your specific trade-offs, tests system boundary conditions, and generates adaptive follow-up probes in real time.
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--glass-border)] text-xs font-mono text-[var(--accent-emerald)] font-semibold">
                Reasoning → Adaptive probes → Deep evaluation
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
