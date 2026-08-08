"use client";

import React, { useEffect, useRef } from "react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { FloatingParticles } from "../three/FloatingParticles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FinalCTAProps {
  onOpenStartModal: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenStartModal }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current!.querySelectorAll("[data-reveal]"),
        { y: 50, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: contentRef.current!,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 overflow-hidden py-24 lg:py-32 text-[#F5F7F4]"
      style={{ background: "linear-gradient(180deg, #0B120E 0%, #050806 100%)" }}
    >
      {/* Ambient effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-16 -translate-x-1/2 h-72 w-[600px] rounded-full bg-[radial-gradient(circle,rgba(31,209,106,0.12)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#1FD16A]/6 blur-[100px]" />
        <FloatingParticles count={25} color="rgba(31, 209, 106, 0.25)" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <div ref={contentRef} className="mx-auto max-w-3xl space-y-8">
          <div data-reveal className="inline-flex items-center gap-2 rounded-full bg-[#051109] border border-[#1FD16A]/30 px-3.5 py-1.5 shadow-[0_0_15px_rgba(31,209,106,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-[#1FD16A]" />
            <span className="text-[11px] font-pixel uppercase tracking-widest text-[#1FD16A]">
              START PRACTICING TODAY
            </span>
          </div>

          <h2 data-reveal className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-tight text-[#F5F7F4]">
            <span className="font-sans font-light text-white">Every other mock interview guesses from your CV.</span><br />
            <span className="font-mono text-[#1FD16A] uppercase tracking-tighter font-semibold">This one knows.</span>
          </h2>

          <p data-reveal className="text-base font-light leading-relaxed text-[#CFD7D0] sm:text-lg">
            Start with Tyler&apos;s recorded session or open the modal and choose
            another candidate. The point is the same: a real interview, not a
            generic practice flow.
          </p>

          <div data-reveal className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
            <button
              onClick={onOpenStartModal}
              className="btn-primary text-base px-8 py-3.5"
            >
              Start practice interview
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <a
              href="#comparison"
              className="btn-secondary flex items-center gap-2 px-6 py-3.5 text-base"
            >
              See the divergence
            </a>
          </div>

          <div data-reveal className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-[#8B968F]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#73F0A0]" />
              No credit card required
            </span>
            <span>Recorded replay</span>
            <span>Real interview logic</span>
          </div>
        </div>
      </div>
    </section>
  );
};
