"use client";

import React from "react";
import { motion } from "framer-motion";

export const PhilosophyQuote: React.FC = () => {
  return (
    <section className="py-28 relative z-10 text-center flex items-center justify-center">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-5xl md:text-6xl font-editorial text-[var(--ink-primary)] tracking-tight leading-[1.15] text-balance"
        >
          Every answer changes <br />
          <span className="italic font-normal text-[var(--accent-champagne)]">
            what comes next.
          </span>
        </motion.h2>
      </div>
    </section>
  );
};
