"use client";

import React from "react";
import { motion } from "framer-motion";

const MOMENTS = [
  {
    numeral: "01",
    title: "Keeps Context",
    description: "Remembers earlier assumptions. If you change a data partition strategy mid-conversation, follow-up probes adjust immediately.",
  },
  {
    numeral: "02",
    title: "Challenges Assumptions",
    description: "Probes edge cases and failure modes. When you claim high availability, it introduces network partitions.",
  },
  {
    numeral: "03",
    title: "Knows When To Push",
    description: "If you nail the basics, questions deepen. If you struggle, it pivots to calibrate your true baseline depth.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const ProductMoments: React.FC = () => {
  return (
    <section className="py-20 relative z-10 border-t border-[var(--glass-border)]">
      <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-2 max-w-md mx-auto"
        >
          <span className="text-xs font-mono text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
            Behavior
          </span>
          <h2 className="text-3xl sm:text-4xl font-editorial text-[var(--ink-primary)] tracking-tight">
            How intelligence behaves
          </h2>
        </motion.div>

        {/* 3 Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {MOMENTS.map((moment) => (
            <motion.div
              key={moment.numeral}
              variants={cardVariants}
              className="glass glass-hover p-6 rounded-2xl flex flex-col justify-between space-y-6 text-left"
            >
              <div className="space-y-4">
                <span className="font-mono text-xs font-semibold text-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 rounded-md w-fit inline-block">
                  {moment.numeral}
                </span>
                <h3 className="text-lg font-editorial text-[var(--ink-primary)]">
                  {moment.title}
                </h3>
                <p className="text-[var(--ink-muted)] text-xs font-normal leading-relaxed">
                  {moment.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
