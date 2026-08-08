"use client";

import React from "react";
import { motion } from "framer-motion";
import { MagneticButton } from "./MagneticButton";

interface FinalCTAProps {
  onOpenStartModal: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenStartModal }) => {
  return (
    <section className="py-28 relative z-10 overflow-hidden border-t border-[var(--glass-border)] text-center">
      {/* Soft emerald wash behind */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[300px] bg-[var(--accent-emerald-soft)] rounded-full filter blur-[120px] opacity-25" />
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 relative z-10 space-y-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-5xl font-editorial text-[var(--ink-primary)] tracking-tight leading-tight"
        >
          Your next interview shouldn&apos;t be your{" "}
          <span className="italic font-normal text-[var(--accent-emerald)]">
            first real one.
          </span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <MagneticButton onClick={onOpenStartModal} className="px-8 py-3 text-sm">
            Start Practicing
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
};
