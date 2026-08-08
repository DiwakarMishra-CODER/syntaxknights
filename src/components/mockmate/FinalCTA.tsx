"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CTAHorizon } from "../three/CTAHorizon";

interface FinalCTAProps {
  onOpenStartModal: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenStartModal }) => {
  return (
    <section className="py-20 bg-[#070A0F] text-white relative z-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="relative glass-dark rounded-3xl p-10 sm:p-16 text-center overflow-hidden border border-slate-800">
          
          {/* Subtle WebGL Horizon Background */}
          <CTAHorizon />

          {/* Foreground Content */}
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl font-sans text-white tracking-tight leading-tight"
            >
              Your next interview <br />
              shouldn&apos;t be your <span className="italic text-[#10B981] font-normal">first real one.</span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col items-center gap-3"
            >
              <button onClick={onOpenStartModal} className="btn-primary-teal text-sm px-8 py-3.5">
                Start your interview
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>

              <span className="text-xs font-sans text-slate-400">
                No credit card required
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
