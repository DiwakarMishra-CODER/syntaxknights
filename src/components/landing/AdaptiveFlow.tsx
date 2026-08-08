"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, GitFork, ListChecks, Sparkles } from "lucide-react";

const DIVERGENCE = [
  {
    name: "Diane Foster",
    completed: "31/31",
    firstTry: "100%",
    story: "Nothing left to prove.",
  },
  {
    name: "Tyler Brooks",
    completed: "31/31",
    firstTry: "3%",
    story: "Got there, but ground it out.",
  },
];

const MOMENTS = [
  {
    step: "01",
    title: "Reads your record",
    body: "Before the first question, MockMate loads completion history, attempt count, and skipped days. Two people who both finished the course do not enter with the same context.",
  },
  {
    step: "02",
    title: "Interviews you",
    body: "A weak answer pushes the depth line upward or sideways. A strong answer earns pressure. The replay makes the adaptation visible instead of asking the judge to trust a summary.",
  },
  {
    step: "03",
    title: "Tells you what to redo",
    body: "The report closes the loop with named gaps and specific curriculum days, so the next session starts from evidence, not generic advice.",
  },
];

export const AdaptiveFlow: React.FC = () => {
  return (
    <section className="relative z-10 bg-[#0A0A0A] py-24 text-[#F5F2EB] lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/3 h-96 w-96 rounded-full bg-[#1FD16A]/6 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#73F0A0]/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:px-8">
        <div id="comparison" className="space-y-10">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#101813] px-3 py-1">
              <GitFork className="h-3.5 w-3.5 text-[#1FD16A]" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#1FD16A]">
                The divergence
              </span>
            </div>
            <h2 className="text-4xl font-editorial text-[#F5F2EB] sm:text-5xl">
              Same cohort. Different interview.
            </h2>
            <p className="text-base font-light leading-relaxed text-[#CFD7D0] font-sans">
              Diane and Tyler both completed the full 31-day program. The point is that completion alone is not enough to explain readiness.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr]">
            <div className="glass-card-green space-y-4 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#1FD16A]">Candidate A</p>
                  <h3 className="mt-2 text-2xl font-editorial text-[#F5F2EB]">{DIVERGENCE[0].name}</h3>
                </div>
                <span className="rounded-full bg-[#101813] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-[#73F0A0]">
                  {DIVERGENCE[0].firstTry}
                </span>
              </div>

              <div className="space-y-3 text-sm leading-relaxed text-[#D6E0D9]">
                <p>Completed: <span className="text-[#F5F2EB]">{DIVERGENCE[0].completed}</span></p>
                <p>{DIVERGENCE[0].story}</p>
              </div>
            </div>

            <div className="flex items-center justify-center px-3 text-[#1FD16A]">
              <div className="space-y-2 text-center">
                <Sparkles className="mx-auto h-5 w-5" />
                <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#8B968F]">
                  same record, different pressure
                </div>
                <ArrowRight className="mx-auto h-4 w-4 rotate-90 lg:rotate-0" />
              </div>
            </div>

            <div className="glass-card-green space-y-4 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#1FD16A]">Candidate B</p>
                  <h3 className="mt-2 text-2xl font-editorial text-[#F5F2EB]">{DIVERGENCE[1].name}</h3>
                </div>
                <span className="rounded-full bg-[#101813] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-[#73F0A0]">
                  {DIVERGENCE[1].firstTry}
                </span>
              </div>

              <div className="space-y-3 text-sm leading-relaxed text-[#D6E0D9]">
                <p>Completed: <span className="text-[#F5F2EB]">{DIVERGENCE[1].completed}</span></p>
                <p>{DIVERGENCE[1].story}</p>
              </div>
            </div>
          </div>
        </div>

        <div id="how-it-works" className="space-y-10">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#101813] px-3 py-1">
              <ListChecks className="h-3.5 w-3.5 text-[#1FD16A]" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#1FD16A]">
                The three moments
              </span>
            </div>
            <h2 className="text-4xl font-editorial text-[#F5F2EB] sm:text-5xl">
              Read. Interview. Report.
            </h2>
            <p className="text-base font-light leading-relaxed text-[#CFD7D0] font-sans">
              Those are the three things the page needs to prove. Everything else is just helping the judge understand the sequence quickly.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {MOMENTS.map((moment) => (
              <motion.div
                key={moment.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.35 }}
                className="glass-card-green space-y-4 p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#1FD16A]">{moment.step}</span>
                  <span className="h-2 w-2 rounded-full bg-[#1FD16A]" />
                </div>
                <h3 className="text-xl font-editorial text-[#F5F2EB]">{moment.title}</h3>
                <p className="text-sm leading-relaxed text-[#D6E0D9] font-sans">{moment.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
