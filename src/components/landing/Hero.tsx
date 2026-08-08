"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Play, ShieldCheck } from "lucide-react";
import { MockMateHeroScene } from "../three/MockMateHeroScene";
import { FloatingParticles } from "../three/FloatingParticles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface HeroProps {
  onOpenStartModal: () => void;
}

const REPLAY_BEATS = [
  {
    question:
      "Walk me through what happens when someone asks your chatbot about their coverage.",
    answer: "It searches the vector database and sends what it finds to the LLM.",
    rationale:
      "Correct but generic — he is describing the diagram, not the build.",
  },
  {
    question: "How many results does it pull back?",
    answer: "I think five. That was the default.",
    rationale:
      "Now the number matters. If the right answer is in the sixth slot, the system breaks.",
  },
];

export const Hero: React.FC<HeroProps> = ({ onOpenStartModal }) => {
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const proofRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  // Rotate conversation beats
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromptIndex((prev) => (prev + 1) % REPLAY_BEATS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // GSAP entrance animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });

      if (headlineRef.current) {
        tl.fromTo(
          headlineRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" },
          0
        );
      }
      if (subtextRef.current) {
        tl.fromTo(
          subtextRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          0.15
        );
      }
      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
          0.3
        );
      }
      if (proofRef.current) {
        tl.fromTo(
          proofRef.current,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
          0.4
        );
      }
      if (visualRef.current) {
        tl.fromTo(
          visualRef.current,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1, ease: "power3.out" },
          0.2
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28"
      style={{ background: "linear-gradient(180deg, #050806 0%, #0B120E 100%)" }}
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(31,209,106,0.15)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute right-[-10%] top-20 w-72 h-72 rounded-full bg-[#22C55E]/8 blur-3xl" />
        <div className="absolute left-[-10%] top-40 w-64 h-64 rounded-full bg-[#73F0A0]/5 blur-3xl" />
        <FloatingParticles count={30} color="rgba(31, 209, 106, 0.3)" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-6">
          {/* Left — Editorial Content */}
          <div className="lg:col-span-6 space-y-7 text-left">
            {/* Eyebrow pill */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-[#051109] border border-[#1FD16A]/30 px-3.5 py-1.5 shadow-[0_0_15px_rgba(31,209,106,0.15)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1FD16A]" />
              <span className="text-[11px] font-pixel uppercase tracking-widest text-[#1FD16A]">
                PROBES BEYOND THE SURFACE
              </span>
            </div>

            {/* Headline */}
            <h1
              ref={headlineRef}
              className="max-w-md text-[clamp(3rem,6vw,5.5rem)] leading-[1] tracking-tight text-[#F5F7F4]"
            >
              <span className="font-sans font-medium text-white">Your adaptive</span><br />
              <span className="font-pixel text-transparent bg-clip-text bg-gradient-to-r from-[#F5F7F4] to-[#73F0A0]">AI Interviewer</span>
            </h1>

            {/* Subtitle */}
            <p
              ref={subtextRef}
              className="max-w-sm text-base sm:text-[17px] font-sans font-light leading-relaxed text-[#CFD7D0]"
            >
              Master your next technical interview. MockMate analyzes your 31-Day AI Cohort journey, adapts to your answers, and uncovers the true depth of your experience.
            </p>

            {/* CTA buttons */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-4 pt-1">
              <button onClick={onOpenStartModal} className="btn-primary">
                Start practice interview
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>

              <a
                href="#how-it-works"
                className="btn-secondary flex items-center gap-2"
              >
                <Play className="h-3.5 w-3.5 fill-current text-[#F5F7F4]" />
                See how it works
              </a>
            </div>

            {/* Proof points */}
            <div
              ref={proofRef}
              className="flex flex-wrap items-center gap-5 pt-3 text-xs text-[#A9B6AF]"
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
            </div>
          </div>

          {/* Right — 3D Scene + Live Telemetry Card */}
          <div
            ref={visualRef}
            className="lg:col-span-6 relative translate-x-4 lg:translate-x-12"
          >
            {/* 3D Scene fills this container */}
            <div className="relative w-full aspect-square max-w-[560px] mx-auto">
              <MockMateHeroScene />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
