"use client";

import React from "react";
import { motion } from "framer-motion";
import { MagneticButton } from "./MagneticButton";

interface HeroProps {
  onOpenStartModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenStartModal }) => {
  return (
    <section className="pt-36 pb-16 md:pt-48 md:pb-20 text-center relative z-10">
      <div className="max-w-4xl mx-auto px-4 md:px-8 flex flex-col items-center">
        {/* Quiet Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex mb-6"
        >
          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)] font-semibold">
            Adaptive Technical Interviews
          </span>
        </motion.div>

        {/* Editorial Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl lg:text-7xl font-editorial text-[var(--ink-primary)] tracking-tight leading-[1.1] text-balance mb-6"
        >
          Practice against <br className="hidden sm:inline" />
          <span className="italic font-normal text-[var(--accent-emerald)]">
            intelligence.
          </span>
        </motion.h1>

        {/* One Line Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg text-[var(--ink-muted)] font-normal max-w-xl mx-auto text-balance mb-8"
        >
          MockMate doesn&apos;t ask better questions. It asks better follow-up questions.
        </motion.p>

        {/* Single Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <MagneticButton onClick={onOpenStartModal} className="px-8 py-3 text-sm">
            Start Practicing
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
};
