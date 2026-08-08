"use client";

"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, GitBranch, MessageSquareQuote, ShieldCheck } from "lucide-react";

const DEPTH_LADDER = [
  { depth: "1", label: "Recall", note: "What happened?" },
  { depth: "2", label: "Application", note: "How did you use it?" },
  { depth: "3", label: "Trade-off", note: "What did you give up?" },
  { depth: "4", label: "Edge case", note: "What breaks first?" },
  { depth: "5", label: "Redesign", note: "What would you change?" },
];

const CLAIMS = [
  {
    text: "It searches the vector database and sends what it finds to the LLM.",
    tag: "verbatim claim",
  },
  {
    text: "I think five. That was the default.",
    tag: "number worth testing",
  },
  {
    text: "Correct but generic — he is describing the diagram, not the build.",
    tag: "reasoning note",
  },
];

export const InterviewDemo: React.FC = () => {
  return (
    <section className="relative z-10 bg-[#050806] py-24 text-[#F5F7F4] lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#1FD16A]/6 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-64 w-64 rounded-full bg-[#73F0A0]/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#101813] px-3 py-1">
            <BookOpen className="h-3.5 w-3.5 text-[#73F0A0]" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#1FD16A]">
              Inside the interview
            </span>
          </div>
          <h2 className="text-4xl font-editorial text-[#F5F2EB] sm:text-5xl">
            The depth line is the proof.
          </h2>
          <p className="text-base font-light leading-relaxed text-[#CFD7D0] font-sans">
            If the answer is shallow, the trace rises. If the answer holds, MockMate digs. The conversation and the reasoning panel stay linked the whole time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.35 }}
            className="glass-card-green space-y-5 p-6 lg:col-span-7"
          >
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.22em] text-[#1FD16A]">
              <MessageSquareQuote className="h-4 w-4" />
              Tyler’s session, excerpted
            </div>

            <div className="space-y-4 rounded-3xl bg-[#0A0A0A] p-5">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#73F0A0]">
                  Interviewer
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#F5F2EB]">
                  Walk me through what happens when someone asks your chatbot about their coverage.
                </p>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#1FD16A]">
                  Tyler
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#D6E0D9]">
                  It searches the vector database and sends what it finds to the LLM.
                </p>
              </div>

              <div className="rounded-2xl bg-[#101813] px-4 py-3">
                <p className="text-xs leading-relaxed text-[#D6E0D9] font-mono">
                  &ldquo;Correct but generic — he is describing the diagram, not the build.&rdquo;
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {CLAIMS.map((claim) => (
                <div key={claim.tag} className="space-y-2 rounded-2xl bg-white/4 px-4 py-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9FB2A7]">
                    {claim.tag}
                  </div>
                  <p className="text-xs leading-relaxed text-[#D6E0D9]">{claim.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="glass-card-green space-y-5 p-6 lg:col-span-5"
          >
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.22em] text-[#1FD16A]">
              <ShieldCheck className="h-4 w-4" />
              Depth ladder
            </div>

            <div className="space-y-3">
              {DEPTH_LADDER.map((step) => (
                <div key={step.depth} className="flex items-start gap-4 rounded-2xl bg-[#0A0A0A] px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#101813] text-xs font-mono font-semibold text-[#1FD16A]">
                    {step.depth}
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-[#F5F2EB]">{step.label}</div>
                    <p className="text-xs leading-relaxed text-[#A9B6AF]">{step.note}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-[#101813] px-4 py-4">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#73F0A0]">
                <GitBranch className="h-4 w-4" />
                Claim ledger
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#D6E0D9]">
                Every claim is filtered against what the candidate actually said. The report only keeps what can be defended.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
