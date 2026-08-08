"use client";

import React, { useEffect, useRef } from "react";
import { ArrowRight, GitFork, ListChecks, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FloatingParticles } from "../three/FloatingParticles";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
  const sectionRef = useRef<HTMLElement>(null);
  const divergenceHeaderRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const momentsHeaderRef = useRef<HTMLDivElement>(null);
  const momentsCardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Divergence header reveal
      if (divergenceHeaderRef.current) {
        gsap.fromTo(
          divergenceHeaderRef.current.querySelectorAll("[data-reveal]"),
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: divergenceHeaderRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Divergence cards
      [card1Ref, card2Ref].forEach((ref, i) => {
        if (ref.current) {
          gsap.fromTo(
            ref.current,
            { y: 60, opacity: 0, scale: 0.95 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.9,
              delay: i * 0.15,
              ease: "power3.out",
              scrollTrigger: {
                trigger: ref.current,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      });

      // Moments header
      if (momentsHeaderRef.current) {
        gsap.fromTo(
          momentsHeaderRef.current.querySelectorAll("[data-reveal]"),
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: momentsHeaderRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Moment cards stagger
      if (momentsCardsRef.current) {
        gsap.fromTo(
          momentsCardsRef.current.children,
          { y: 50, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: momentsCardsRef.current,
              start: "top 85%",
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
      className="relative z-10 overflow-hidden py-24 lg:py-32 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-[#0B120E] dark:via-[#050806] dark:to-[#0B120E]"
    >
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 top-1/3 h-96 w-96 rounded-full bg-[#1FD16A]/5 blur-[120px]" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#73F0A0]/4 blur-[100px]" />
        <FloatingParticles count={20} color="rgba(115, 240, 160, 0.2)" />
      </div>

      <div className="mx-auto max-w-7xl space-y-24 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── The Divergence ── */}
        <div id="comparison" className="space-y-10">
          <div ref={divergenceHeaderRef} className="mx-auto max-w-3xl space-y-4 text-center">
            <div data-reveal className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#051109] border border-[#1FD16A]/30 px-3 py-1 shadow-[0_0_15px_rgba(31,209,106,0.15)]">
              <GitFork className="h-3.5 w-3.5 text-[#1FD16A]" />
              <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#1FD16A]">
                THE DIVERGENCE
              </span>
            </div>
            <h2 data-reveal className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] tracking-tight text-slate-900 dark:text-[#F5F7F4]">
              <span className="font-sans font-medium text-[clamp(1.5rem,3vw,2.5rem)] text-[#1FD16A]">Same cohort.</span><br />
              <span className="font-sans tracking-tight font-medium italic text-slate-900 dark:text-white">Different interview.</span>
            </h2>
            <p data-reveal className="text-base font-light leading-relaxed text-slate-600 dark:text-[#CFD7D0]">
              Diane and Tyler both completed the full 31-day program. The point is
              that completion alone is not enough to explain readiness.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr]">
            <div ref={card1Ref} className="glass-card-green space-y-4 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#1FD16A]">
                    Candidate A
                  </p>
                  <h3 className="mt-2 text-2xl font-sans tracking-tight font-medium text-slate-900 dark:text-[#F5F7F4]">
                    {DIVERGENCE[0].name}
                  </h3>
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-[#101813] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-[#73F0A0]">
                  {DIVERGENCE[0].firstTry}
                </span>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                <p>
                  Completed:{" "}
                  <span className="text-slate-900 dark:text-[#F5F7F4]">
                    {DIVERGENCE[0].completed}
                  </span>
                </p>
                <p>{DIVERGENCE[0].story}</p>
              </div>
            </div>

            <div className="flex items-center justify-center px-3 text-[#1FD16A]">
              <div className="space-y-2 text-center">
                <Sparkles className="mx-auto h-5 w-5" />
                <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-500 dark:text-[#8B968F]">
                  same record, different pressure
                </div>
                <ArrowRight className="mx-auto h-4 w-4 rotate-90 lg:rotate-0" />
              </div>
            </div>

            <div ref={card2Ref} className="glass-card-green space-y-4 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#1FD16A]">
                    Candidate B
                  </p>
                  <h3 className="mt-2 text-2xl font-sans tracking-tight font-medium text-slate-900 dark:text-[#F5F7F4]">
                    {DIVERGENCE[1].name}
                  </h3>
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-[#101813] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-[#73F0A0]">
                  {DIVERGENCE[1].firstTry}
                </span>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                <p>
                  Completed:{" "}
                  <span className="text-slate-900 dark:text-[#F5F7F4]">
                    {DIVERGENCE[1].completed}
                  </span>
                </p>
                <p>{DIVERGENCE[1].story}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── The Three Moments ── */}
        <div id="how-it-works" className="space-y-10">
          <div ref={momentsHeaderRef} className="mx-auto max-w-3xl space-y-4 text-center">
            <div data-reveal className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#051109] border border-[#1FD16A]/30 px-3 py-1 shadow-[0_0_15px_rgba(31,209,106,0.15)]">
              <ListChecks className="h-3.5 w-3.5 text-[#1FD16A]" />
              <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#1FD16A]">
                THE THREE MOMENTS
              </span>
            </div>
            <h2 data-reveal className="text-[clamp(2.5rem,5vw,4rem)] leading-[1] tracking-tight text-slate-900 dark:text-[#F5F7F4]">
              <span className="font-sans font-medium text-slate-900 dark:text-white">Read. Interview.</span><br />
              <span className="font-sans font-medium text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-emerald-600 dark:from-[#F5F7F4] dark:to-[#73F0A0]">Report.</span>
            </h2>
            <p data-reveal className="text-base font-light leading-relaxed text-slate-600 dark:text-[#CFD7D0]">
              Those are the three things the page needs to prove. Everything else
              is just helping the judge understand the sequence quickly.
            </p>
          </div>

          <div ref={momentsCardsRef} className="grid gap-4 lg:grid-cols-3">
            {MOMENTS.map((moment) => (
              <div
                key={moment.step}
                className="glass-card-green space-y-4 p-6 group cursor-default"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl font-sans tracking-tight font-medium text-[#1FD16A] opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                    {moment.step}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-[#1FD16A] group-hover:shadow-[0_0_12px_rgba(31,209,106,0.8)] transition-shadow duration-500" />
                </div>
                <h3 className="text-xl font-sans tracking-tight font-medium text-slate-900 dark:text-[#F5F7F4]">
                  {moment.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                  {moment.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
