"use client";

import React, { useEffect, useRef, useState } from "react";
import { Award, ArrowRight, FileText, Activity } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  // Live metric pulsing state
  const [pulseMetric, setPulseMetric] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseMetric((prev) => (prev + 1) % 3);
    }, 2000);
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

      if (leftColRef.current) {
        gsap.fromTo(
          leftColRef.current.children,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: leftColRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      if (rightColRef.current) {
        gsap.fromTo(
          rightColRef.current,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rightColRef.current,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );

        const steps = rightColRef.current.querySelectorAll("[data-step]");
        gsap.fromTo(
          steps,
          { x: 40, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rightColRef.current,
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
      className="relative z-10 overflow-hidden py-24 lg:py-32 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#050806] dark:to-[#0B120E]"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#1FD16A]/5 blur-[120px]" />
        <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-[#73F0A0]/4 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={headerRef} className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div data-reveal className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#051109] border border-[#1FD16A]/30 px-3 py-1 shadow-[0_0_15px_rgba(31,209,106,0.15)]">
            <Award className="h-3.5 w-3.5 text-[#1FD16A]" />
            <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#1FD16A]">
              THE REPORT
            </span>
          </div>
          <h2 data-reveal className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-tight text-slate-900 dark:text-[#F5F7F4]">
            <span className="font-sans tracking-tight font-medium text-slate-900 dark:text-white">An annotated transcript.</span><br />
            <span className="font-sans tracking-tight font-medium italic text-[#1FD16A]">Not a scorecard.</span>
          </h2>
          <p data-reveal className="text-base font-light leading-relaxed text-slate-600 dark:text-[#CFD7D0]">
            The report should help the judge understand why the interview landed
            the way it did, then point the candidate to the next useful days.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div ref={leftColRef} className="space-y-6 lg:col-span-6">
            <div className="glass-card-green relative overflow-hidden space-y-6 p-8 text-left animate-scanline border-[rgba(31,209,106,0.2)]">
              <div className="flex items-center justify-between relative z-10">
                <span className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#1FD16A]">
                  <Activity className="h-4 w-4" />
                  Live Evidence summary
                </span>
                <span className="rounded-full bg-[#1FD16A]/10 border border-[#1FD16A]/20 px-2.5 py-1 text-[10px] font-mono font-semibold text-[#73F0A0] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1FD16A] animate-pulse" />
                  Analyzing
                </span>
              </div>

              <div className="space-y-4 relative z-10">
                <blockquote className="rounded-2xl bg-white dark:bg-[#0A0A0A] p-5 text-sm leading-relaxed text-slate-600 dark:text-[#D6E0D9] border border-slate-200 dark:border-[rgba(255,255,255,)]">
                  &ldquo;Redid Day 23 (MCP server build), then Day 24. You passed
                  both, but on the second attempt, and the interview showed the
                  gap is in tool schema design.&rdquo;
                </blockquote>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {/* Metric 1 */}
                  <div className={`rounded-xl bg-slate-100 dark:bg-[#101813] px-4 py-3 border transition-colors duration-300 ${pulseMetric === 0 ? "border-[#1FD16A]/40 bg-[rgba(31,209,106,0.05)]" : "border-slate-200 dark:border-[rgba(255,255,255,)]"}`}>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9FB2A7]">
                      Concept
                    </div>
                    <div className="mt-2 text-sm text-slate-900 dark:text-[#F5F7F4] flex items-center justify-between">
                      Strong
                      {pulseMetric === 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#1FD16A]" />}
                    </div>
                  </div>
                  {/* Metric 2 */}
                  <div className={`rounded-xl bg-slate-100 dark:bg-[#101813] px-4 py-3 border transition-colors duration-300 ${pulseMetric === 1 ? "border-[#1FD16A]/40 bg-[rgba(31,209,106,0.05)]" : "border-slate-200 dark:border-[rgba(255,255,255,)]"}`}>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9FB2A7]">
                      Communication
                    </div>
                    <div className="mt-2 text-sm text-slate-900 dark:text-[#F5F7F4] flex items-center justify-between">
                      Uneven
                      {pulseMetric === 1 && <span className="w-1.5 h-1.5 rounded-full bg-[#1FD16A]" />}
                    </div>
                  </div>
                  {/* Metric 3 */}
                  <div className={`rounded-xl bg-slate-100 dark:bg-[#101813] px-4 py-3 col-span-2 sm:col-span-1 border transition-colors duration-300 ${pulseMetric === 2 ? "border-[#1FD16A]/40 bg-[rgba(31,209,106,0.05)]" : "border-slate-200 dark:border-[rgba(255,255,255,)]"}`}>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9FB2A7]">
                      Signal
                    </div>
                    <div className="mt-2 text-sm text-[#1FD16A] leading-tight">
                      Use next run to tighten reasoning
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4 text-left group hover:border-[#1FD16A]/30 transition-colors duration-500">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-[#F5F7F4] group-hover:text-[#1FD16A] transition-colors">
                <FileText className="h-4 w-4 text-[#1FD16A]" />
                Direct Transcript Evidence
              </div>

              <blockquote className="rounded-2xl bg-white dark:bg-[#0A0A0A] p-4 text-sm italic leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                &ldquo;Correct but generic — he is describing the diagram, not
                the build. Pushing for a number he should know.&rdquo;
              </blockquote>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8B968F]">
                <span>Evaluated by MockMate AI</span>
                <span className="text-[#1FD16A] font-mono flex items-center gap-1.5">
                  Verbatim checked
                  <Award className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          <div ref={rightColRef} className="glass-card space-y-6 p-8 text-left lg:col-span-6 border-slate-200 dark:border-[rgba(255,255,255,)] hover:border-[#1FD16A]/20 transition-colors duration-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-sans tracking-tight font-medium text-slate-900 dark:text-[#F5F7F4]">
                Next steps, tied to curriculum days
              </h3>
              <ArrowRight className="h-5 w-5 text-[#1FD16A]" />
            </div>

            <div className="space-y-4">
              {NEXT_STEPS.map((step) => (
                <div
                  key={step.day}
                  data-step
                  className="rounded-2xl bg-white dark:bg-[#0A0A0A] p-5 group hover:bg-slate-50 dark:bg-[#0E1712] hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-transparent hover:border-[#1FD16A]/20 hover:shadow-[0_4px_20px_rgba(31,209,106,0.05)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#1FD16A] group-hover:text-[#73F0A0] transition-colors duration-300">
                      {step.day}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-[#8B968F] group-hover:text-slate-600 dark:text-[#CFD7D0] transition-colors duration-300">
                      {step.title}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                    {step.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
