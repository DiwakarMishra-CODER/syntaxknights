"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText } from "lucide-react";
import { MagneticButton } from "./MagneticButton";

const GlassDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[var(--ink-primary)]/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] p-4 sm:p-0"
          >
            <div className="bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col text-left">
              {/* Dialog Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)] bg-[var(--bg-base)]">
                <div>
                  <h2 className="text-base font-sans text-[var(--ink-primary)] font-semibold">
                    Evaluation Dossier Preview
                  </h2>
                  <p className="text-xs font-mono text-[var(--ink-muted)] mt-0.5">
                    TECHNICAL FOCUS: DISTRIBUTED SYSTEMS
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[var(--glass-border)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dialog Content */}
              <div className="overflow-y-auto p-6 space-y-6 text-xs text-[var(--ink-primary)]">
                {/* 2 Clean Circular Gauges */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-base)] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-[var(--ink-muted)]">SYSTEM BOUNDARIES</div>
                      <div className="text-lg font-sans text-[var(--accent-emerald)] font-bold">Strong Hire</div>
                    </div>
                    <svg className="w-10 h-10 transform -rotate-90">
                      <circle cx="20" cy="20" r="16" stroke="var(--glass-border)" strokeWidth="3" fill="none" />
                      <circle cx="20" cy="20" r="16" stroke="var(--accent-emerald)" strokeWidth="3" strokeDasharray="100" strokeDashoffset="25" fill="none" />
                    </svg>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-base)] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-[var(--ink-muted)]">TRADE-OFF REASONING</div>
                      <div className="text-lg font-sans text-[var(--accent-emerald)] font-bold">Strong Hire</div>
                    </div>
                    <svg className="w-10 h-10 transform -rotate-90">
                      <circle cx="20" cy="20" r="16" stroke="var(--glass-border)" strokeWidth="3" fill="none" />
                      <circle cx="20" cy="20" r="16" stroke="var(--accent-emerald)" strokeWidth="3" strokeDasharray="100" strokeDashoffset="15" fill="none" />
                    </svg>
                  </div>
                </div>

                {/* Feedback Notes */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--accent-emerald-soft)]/20 border border-[var(--accent-emerald)]/30 space-y-1">
                    <div className="font-mono text-[11px] text-[var(--accent-emerald)] font-semibold uppercase">
                      Architectural Depth
                    </div>
                    <p className="text-[var(--ink-primary)] leading-relaxed font-normal">
                      Articulated edge-rate limiting with clear token bucket bounds. When pressed on network partitions, correctly identified quorum write trade-offs.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--accent-champagne)]/10 border border-[var(--accent-champagne)]/30 space-y-1">
                    <div className="font-mono text-[11px] text-[var(--accent-champagne)] font-semibold uppercase">
                      Growth Opportunity
                    </div>
                    <p className="text-[var(--ink-primary)] leading-relaxed font-normal">
                      Initial cache invalidation proposal relied on write-through; probe deeper into lease-based caching under high write contention.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const ActionableReport: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section id="dossier" className="py-20 relative z-10 border-t border-[var(--glass-border)]">
      <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-3 max-w-xl mx-auto"
        >
          <span className="text-xs font-mono text-[var(--accent-emerald)] uppercase tracking-wider font-semibold">
            Post-Interview Evaluation
          </span>
          <h2 className="text-3xl sm:text-4xl font-sans text-[var(--ink-primary)] tracking-tight">
            Leave knowing <span className="italic font-normal text-[var(--accent-emerald)]">what to improve.</span>
          </h2>
          <p className="text-sm text-[var(--ink-muted)] font-normal">
            No generic scores. An engineering-level evaluation of your architectural choices and communication clarity.
          </p>
        </motion.div>

        {/* Report Preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass glass-hover p-8 rounded-2xl space-y-6 text-left max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-4">
            <div>
              <div className="text-xs font-mono text-[var(--ink-muted)]">SAMPLE DOSSIER</div>
              <div className="text-sm font-sans text-[var(--ink-primary)] font-semibold">
                System Design Evaluation
              </div>
            </div>
            <div className="px-2.5 py-1 rounded bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)] text-xs font-mono font-semibold border border-[var(--accent-emerald)]/20">
              HIRE RECOMMENDATION
            </div>
          </div>

          {/* Minimal 2 Gauges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[var(--ink-muted)]">SYSTEM BOUNDARIES</div>
                <div className="text-base font-sans text-[var(--accent-emerald)] font-semibold">Strong</div>
              </div>
              <svg className="w-8 h-8 transform -rotate-90">
                <circle cx="16" cy="16" r="12" stroke="var(--glass-border)" strokeWidth="2.5" fill="none" />
                <circle cx="16" cy="16" r="12" stroke="var(--accent-emerald)" strokeWidth="2.5" strokeDasharray="75" strokeDashoffset="18" fill="none" />
              </svg>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[var(--ink-muted)]">TRADE-OFF CLARITY</div>
                <div className="text-base font-sans text-[var(--accent-emerald)] font-semibold">Strong</div>
              </div>
              <svg className="w-8 h-8 transform -rotate-90">
                <circle cx="16" cy="16" r="12" stroke="var(--glass-border)" strokeWidth="2.5" fill="none" />
                <circle cx="16" cy="16" r="12" stroke="var(--accent-emerald)" strokeWidth="2.5" strokeDasharray="75" strokeDashoffset="10" fill="none" />
              </svg>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <MagneticButton onClick={() => setIsModalOpen(true)} variant="secondary" className="text-xs px-5 py-2">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-[var(--ink-muted)]" />
              View Full Sample Dossier
            </MagneticButton>
          </div>
        </motion.div>
      </div>

      <GlassDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};
