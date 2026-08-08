"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquareText, Brain, GitBranch, Target } from "lucide-react";

const STEPS = [
  {
    numeral: "01",
    title: "You answer",
    description: "Share your thinking in your own words.",
    icon: MessageSquareText,
    glowColor: "rgba(16, 185, 129, 0.15)",
  },
  {
    numeral: "02",
    title: "AI evaluates",
    description: "Understands context and depth.",
    icon: Brain,
    glowColor: "rgba(56, 189, 248, 0.15)",
  },
  {
    numeral: "03",
    title: "It adapts",
    description: "Chooses the best follow-up.",
    icon: GitBranch,
    glowColor: "rgba(168, 85, 247, 0.15)",
  },
  {
    numeral: "04",
    title: "You improve",
    description: "Get clearer insights and build confidence.",
    icon: Target,
    glowColor: "rgba(245, 158, 11, 0.15)",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-[#F8FAFC] text-[#0F172A] relative z-10 text-left">
      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-16">
        
        {/* Section Header matching reference image */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="space-y-3 max-w-xl"
        >
          <span className="text-xs font-mono font-semibold tracking-widest uppercase text-[#10B981]">
            HOW IT WORKS
          </span>
          <h2 className="text-4xl sm:text-5xl font-sans text-[#0F172A] tracking-tight leading-tight">
            Every answer changes what <br />
            <span className="italic font-normal text-[#10B981]">comes next.</span>
          </h2>
        </motion.div>

        {/* Horizontal Connected 4-Step Flow matching reference image */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative"
        >
          {STEPS.map((step, idx) => (
            <motion.div
              key={step.numeral}
              variants={itemVariants}
              className="flex flex-col items-center text-center space-y-4 group relative"
            >
              {/* Circular Icon Container matching reference image glowing circle */}
              <div 
                className="w-20 h-20 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105"
                style={{
                  boxShadow: `0 10px 30px ${step.glowColor}, inset 0 1px 0 rgba(255,255,255,1)`
                }}
              >
                <step.icon className="w-8 h-8 text-[#10B981]" strokeWidth={1.5} />
              </div>

              {/* Connecting line to next item */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+45px)] right-[calc(-50%+45px)] h-px bg-gradient-to-r from-[#10B981]/50 to-slate-300 z-0" />
              )}

              {/* Text Content */}
              <div className="space-y-1.5 pt-2">
                <h3 className="text-base font-semibold text-[#0F172A] font-sans">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed max-w-[200px] mx-auto">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
