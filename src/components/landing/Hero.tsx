"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Play, Sparkles } from "lucide-react";
import { DepthTrace } from "../DepthTrace";

interface HeroProps {
  onOpenStartModal: () => void;
}

const REPLAY_BEATS = [
  {
    question: "Walk me through what happens when someone asks your chatbot about their coverage.",
    answer: "It searches the vector database and sends what it finds to the LLM.",
    rationale: "Correct but generic — he is describing the diagram, not the build.",
  },
  {
    question: "How many results does it pull back?",
    answer: "I think five. That was the default.",
    rationale: "Now the number matters. If the right answer is in the sixth slot, the system breaks.",
  },
];

const TRACE_POINTS = [
  { depth: 2, day: 7, measured: true },
  { depth: 2, day: 11, measured: true },
  { depth: 3, day: 20, measured: true },
  { depth: 4, day: 23, measured: true },
  { depth: 3, day: 23, measured: true },
  { depth: 4, day: 27, measured: true },
  { depth: 5, day: 31, measured: true },
] as const;

export const Hero: React.FC<HeroProps> = ({ onOpenStartModal }) => {
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);

    updatePreference();
    media.addEventListener("change", updatePreference);

    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setActivePromptIndex((prev) => (prev + 1) % REPLAY_BEATS.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      setActivePromptIndex(1);
    }
  }, [reduceMotion]);

  const replayPoints = [...TRACE_POINTS].slice(0, reduceMotion ? 4 : 7);

  return (
    <section className="relative z-10 overflow-hidden bg-[#0A0A0A] pt-36 pb-24 text-[#F5F2EB] lg:pt-44 lg:pb-32">
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: 560 }}>
        <div className="absolute left-1/2 top-0 h-96 w-3xl -translate-x-1/2 rounded-full bg-linear-to-b from-[#1FD16A]/22 via-[#1FD16A]/10 to-transparent blur-3xl" />
        <div className="absolute right-[-10%] top-24 h-72 w-72 rounded-full bg-[#22C55E]/10 blur-3xl" />
        <div className="absolute left-[-10%] top-40 h-72 w-72 rounded-full bg-[#73F0A0]/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="relative z-10 space-y-8 text-left lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#0E1712] px-3.5 py-1.5 shadow-lg shadow-black/30"
            >
              <span className="h-2 w-2 rounded-full bg-[#1FD16A] animate-pulse" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[#1FD16A]">
                  Reads the cohort record before you speak
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl text-5xl leading-[1.04] tracking-tight text-[#F5F2EB] sm:text-6xl lg:text-7xl font-editorial"
            >
                Every mock interview guesses from your CV. <br />
                This one <span className="pr-2 font-normal italic text-[#73F0A0]">already knows.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl text-base font-light leading-relaxed text-[#CFD7D0] sm:text-lg"
            >
                Diane Foster and Tyler Brooks both finished the same 31 days. One can explain it cleanly. The other has to earn every answer.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <button onClick={onOpenStartModal} className="btn-pill-amber">
                Start practice interview
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>

              <a href="#how-it-works" className="btn-pill-secondary flex items-center gap-2">
                <Play className="h-3.5 w-3.5 fill-current text-[#F5F2EB]" />
                See how it works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#A9B6AF]"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1FD16A]" />
                Recorded replay
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1FD16A]" />
                No API calls
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1FD16A]" />
                Respects reduced motion
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center justify-center lg:col-span-6"
          >
            <div className="relative w-full max-w-2xl">
              <div className="absolute inset-0 rounded-4xl bg-linear-to-br from-[#1FD16A]/16 via-[#0D120E] to-[#060706] blur-2xl scale-95" />

              <div className="relative overflow-hidden rounded-4xl bg-[#0C100D] shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,209,106,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_26%)]" />

                <div className="relative space-y-5 p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#1FD16A]">Live replay</p>
                      <h3 className="mt-2 text-2xl font-editorial text-[#F5F2EB]">Tyler’s session, at readable speed.</h3>
                    </div>
                    <span className="rounded-full bg-[#101813] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-[#73F0A0]">
                      autoplays
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activePromptIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      <div className="rounded-3xl bg-[#0A0A0A] px-4 py-3">
                        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#73F0A0]">
                          Interviewer
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-[#F5F2EB]">
                          {REPLAY_BEATS[activePromptIndex].question}
                        </p>
                      </div>

                      <div className="rounded-3xl bg-[#101813] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#1FD16A]">
                            Candidate
                          </div>
                          <span className="text-[10px] font-mono text-[#9FB2A7]">depth shifts next</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-[#E8F0E9]">
                          {REPLAY_BEATS[activePromptIndex].answer}
                        </p>
                      </div>

                      <div className="rounded-3xl bg-white/4 px-4 py-3">
                        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#9FB2A7]">
                          Why it asked
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-[#D6E0D9]">
                          {REPLAY_BEATS[activePromptIndex].rationale}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#1FD16A]">
                        Depth trace
                      </span>
                      <span className="text-[11px] font-mono text-[#8B968F]">1 recall · 5 redesign</span>
                    </div>
                    <DepthTrace
                      points={replayPoints}
                      thinking={!reduceMotion}
                      activeIndex={reduceMotion ? null : activePromptIndex}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
