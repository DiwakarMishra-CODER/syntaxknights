"use client";

import React, { useEffect, useRef, useState } from "react";
import { BookOpen, GitBranch, MessageSquareQuote, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const leftCardRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);

  // Live dashboard state
  const [activeLadderIndex, setActiveLadderIndex] = useState(0);

  // Cycle the active ladder step to simulate live AI analysis
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLadderIndex((prev) => (prev + 1) % DEPTH_LADDER.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.querySelectorAll("[data-reveal]"),
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      if (leftCardRef.current) {
        gsap.fromTo(
          leftCardRef.current,
          { x: -60, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: leftCardRef.current,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      if (rightCardRef.current) {
        gsap.fromTo(
          rightCardRef.current,
          { x: 60, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            delay: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rightCardRef.current,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );

        const items = rightCardRef.current.querySelectorAll("[data-ladder]");
        gsap.fromTo(
          items,
          { x: 30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rightCardRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 overflow-hidden py-24 lg:py-32 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-[#0B120E] dark:to-[#050806]"
    >
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#1FD16A]/5 blur-[120px]" />
        <div className="absolute left-0 bottom-0 h-64 w-64 rounded-full bg-[#73F0A0]/4 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={headerRef} className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div data-reveal className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#051109] border border-[#1FD16A]/30 px-3 py-1 shadow-[0_0_15px_rgba(31,209,106,0.15)]">
            <BookOpen className="h-3.5 w-3.5 text-[#1FD16A]" />
            <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#1FD16A]">
              THE PLAYGROUND
            </span>
          </div>
          <h2 data-reveal className="text-[clamp(2.5rem,5vw,4rem)] leading-[1] tracking-tight text-slate-900 dark:text-[#F5F7F4]">
            <span className="font-sans font-light text-slate-600 dark:text-[#CFD7D0]">Live interview</span><br />
            <span className="font-sans font-black uppercase text-[#1FD16A] tracking-tighter">Environment.</span>
          </h2>
          <p data-reveal className="text-base font-light leading-relaxed text-slate-600 dark:text-[#CFD7D0]">
            If the answer is shallow, the trace rises. If the answer holds,
            MockMate digs. The conversation and the reasoning panel stay linked
            the whole time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Conversation excerpt */}
          <div ref={leftCardRef} className="glass-card-green space-y-5 p-6 lg:col-span-7 animate-scanline">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.22em] text-[#1FD16A]">
                <MessageSquareQuote className="h-4 w-4" />
                Tyler&apos;s session, live trace
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1FD16A] animate-pulse" />
                <span className="text-[10px] font-mono text-[#73F0A0]">Processing</span>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl bg-white dark:bg-[#0A0A0A] p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[rgba(31,209,106,0.1)]">
                <div className="h-8 w-full bg-[#1FD16A] shadow-[0_0_8px_#1FD16A] animate-[scanline_3s_linear_infinite]" />
              </div>
              <div className="pl-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#73F0A0]">
                  Interviewer
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-900 dark:text-[#F5F7F4]">
                  Walk me through what happens when someone asks your chatbot
                  about their coverage.
                </p>
              </div>

              <div className="pl-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#1FD16A]">
                  Tyler
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                  It searches the vector database and sends what it finds to the
                  LLM.
                </p>
              </div>

              <div className="ml-4 rounded-xl bg-slate-100 dark:bg-[#101813] px-4 py-3 relative overflow-hidden border border-[rgba(31,209,106,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(31,209,106,0.05)] to-transparent -translate-x-full animate-[scanline_2s_ease-in-out_infinite_alternate]" />
                <p className="text-xs leading-relaxed text-slate-600 dark:text-[#D6E0D9] font-mono animate-typewriter whitespace-nowrap overflow-hidden">
                  &ldquo;Correct but generic — he is describing the diagram, not
                  the build.&rdquo;
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {CLAIMS.map((claim, i) => (
                <div
                  key={claim.tag}
                  className={`space-y-2 rounded-xl bg-slate-100 dark:bg-[#101813] px-4 py-3 border border-[rgba(31,209,106,0.15)] transition-all duration-300 ${
                    i === activeLadderIndex % 3 ? "animate-data-pulse bg-[rgba(31,209,106,0.05)]" : ""
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9FB2A7]">
                    {claim.tag}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                    {claim.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Depth ladder */}
          <div ref={rightCardRef} className="glass-card-green space-y-5 p-6 lg:col-span-5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.22em] text-[#1FD16A]">
              <ShieldCheck className="h-4 w-4" />
              Active Depth Ladder
            </div>

            <div className="space-y-3 relative">
              {DEPTH_LADDER.map((step, idx) => {
                const isActive = idx === activeLadderIndex;
                const isPassed = idx < activeLadderIndex;

                return (
                  <div
                    key={step.depth}
                    data-ladder
                    className={`flex items-start gap-4 rounded-xl px-4 py-3 transition-all duration-500 ${
                      isActive ? "bg-slate-50 dark:bg-[#0E1712] border border-[rgba(31,209,106,0.2)] shadow-[0_0_15px_rgba(31,209,106,0.08)]" : "bg-white dark:bg-[#0A0A0A] border border-transparent"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-mono font-semibold transition-all duration-500 ${
                        isActive
                          ? "bg-[#1FD16A] text-[#050806] shadow-[0_0_12px_rgba(31,209,106,0.6)]"
                          : isPassed
                          ? "bg-slate-100 dark:bg-[#101813] border border-[#1FD16A]/40 text-[#1FD16A]"
                          : "bg-slate-100 dark:bg-[#101813] text-[#7E8B84]"
                      }`}
                    >
                      {step.depth}
                    </div>
                    <div className="space-y-1">
                      <div className={`text-sm font-semibold transition-colors duration-300 ${isActive ? "text-[#1FD16A]" : "text-slate-900 dark:text-[#F5F7F4]"}`}>
                        {step.label}
                      </div>
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-[#A9B6AF]">
                        {step.note}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl bg-slate-100 dark:bg-[#101813] px-4 py-4 border border-[rgba(31,209,106,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                 <span className="flex h-2 w-2 rounded-full bg-[#1FD16A] animate-pulse" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#73F0A0]">
                <GitBranch className="h-4 w-4" />
                Claim ledger updating
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                Every claim is filtered against what the candidate actually said.
                The report only keeps what can be defended.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
