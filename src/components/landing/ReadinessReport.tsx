"use client";

import React from "react";
import { motion } from "framer-motion";
import { Award, ArrowRight, FileText } from "lucide-react";

const NEXT_STEPS = [
  {
    day: "Day 23",
    title: "Model Context Protocol",
    note: "Redo the tool schema decision, then revisit the interface contract.",
  },
  {
    day: "Day 24",
    title: "Tooling follow-through",
    note: "You passed both attempts, but the interview shows the schema logic is still shaky.",
  },
  {
    day: "Day 27",
    title: "Security, Privacy & Guardrails",
    note: "Close the gap on defensive reasoning and keep the claim language tight.",
  },
];

export const ReadinessReport: React.FC = () => {
  return (
    <section className="relative z-10 bg-[#050806] py-24 text-[#F5F7F4] lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#1FD16A]/6 blur-3xl" />
        <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-[#73F0A0]/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#101813] px-3 py-1">
            <Award className="h-3.5 w-3.5 text-[#1FD16A]" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#1FD16A]">
              The report
            </span>
          </div>
          <h2 className="text-4xl font-editorial text-[#F5F2EB] sm:text-5xl">
            An annotated transcript, not a scorecard.
          </h2>
          <p className="text-base font-light leading-relaxed text-[#CFD7D0] font-sans">
            The report should help the judge understand why the interview landed the way it did, then point the candidate to the next useful days.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-6">
            <div className="glass-card-green relative overflow-hidden space-y-6 p-8 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1FD16A]">
                  Evidence summary
                </span>
                <span className="rounded-full bg-[#101813] px-2.5 py-1 text-xs font-mono font-semibold text-[#73F0A0]">
                  Direct quotes only
                </span>
              </div>

              <div className="space-y-4">
                <blockquote className="rounded-3xl bg-[#0A0A0A] p-5 text-sm leading-relaxed text-[#D6E0D9]">
                  &ldquo;Redid Day 23 (MCP server build), then Day 24. You passed both, but on the second attempt, and the interview showed the gap is in tool schema design.&rdquo;
                </blockquote>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#101813] px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9FB2A7]">Concept</div>
                    <div className="mt-2 text-sm text-[#F5F2EB]">Strong</div>
                  </div>
                  <div className="rounded-2xl bg-[#101813] px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9FB2A7]">Communication</div>
                    <div className="mt-2 text-sm text-[#F5F2EB]">Uneven</div>
                  </div>
                  <div className="rounded-2xl bg-[#101813] px-4 py-3 sm:col-span-1 col-span-2">
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9FB2A7]">Signal</div>
                    <div className="mt-2 text-sm text-[#1FD16A]">Use the next run to tighten schema reasoning</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4 text-left">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#F5F2EB]">
                <FileText className="h-4 w-4 text-[#1FD16A]" />
                Direct Transcript Evidence
              </div>

              <blockquote className="rounded-3xl bg-[#0A0A0A] p-4 text-sm italic leading-relaxed text-[#D6E0D9] font-sans">
                &ldquo;Correct but generic — he is describing the diagram, not the build. Pushing for a number he should know.&rdquo;
              </blockquote>

              <div className="flex items-center justify-between text-xs text-[#8B968F]">
                <span>Evaluated by MockMate AI</span>
                <span className="text-[#1FD16A] font-mono">Verbatim checked</span>
              </div>
            </div>
          </div>

          <div className="glass-card space-y-6 p-8 text-left lg:col-span-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-editorial text-[#F5F2EB]">
                Next steps, tied to curriculum days
              </h3>
              <ArrowRight className="h-5 w-5 text-[#1FD16A]" />
            </div>

            <div className="space-y-4">
              {NEXT_STEPS.map((step) => (
                <motion.div
                  key={step.day}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl bg-[#0A0A0A] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#1FD16A]">
                      {step.day}
                    </span>
                    <span className="text-[11px] font-mono text-[#8B968F]">{step.title}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#D6E0D9]">{step.note}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
