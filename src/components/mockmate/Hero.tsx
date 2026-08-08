"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, Star } from "lucide-react";
import { MockMateOrbital } from "../three/MockMateOrbital";

interface HeroProps {
  onOpenStartModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenStartModal }) => {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative z-10 overflow-hidden bg-[#070A0F]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column — Editorial Content matching reference image */}
        <div className="lg:col-span-6 space-y-8 text-left">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <span className="text-xs font-mono font-semibold tracking-widest uppercase text-[#10B981]">
              ADAPTIVE AI INTERVIEWS
            </span>
          </motion.div>

          {/* Large Editorial Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-sans text-white tracking-tight leading-[1.05]"
          >
            An interviewer <br />
            that <span className="italic text-[#10B981] font-normal">thinks.</span>
          </motion.h1>

          {/* Supporting Copy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-lg"
          >
            MockMate adapts to your answers, asks smarter follow-ups, and helps you improve where it matters most.
          </motion.p>

          {/* CTA Group */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <button onClick={onOpenStartModal} className="btn-primary-teal text-sm px-6 py-3">
              Start your interview
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>

            <a href="#how-it-works" className="btn-ghost-dark text-sm px-5 py-3 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-current text-[#10B981]" />
              See how it works
            </a>
          </motion.div>

          {/* Learner Rating Proof Row matching reference image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-4 pt-4"
          >
            {/* Avatar Stack */}
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#070A0F] bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                A
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#070A0F] bg-teal-800 flex items-center justify-center font-bold text-xs text-white">
                S
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#070A0F] bg-slate-600 flex items-center justify-center font-bold text-xs text-white">
                R
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#070A0F] bg-emerald-900 flex items-center justify-center font-bold text-xs text-white">
                M
              </div>
            </div>

            {/* Stars and Learner Text */}
            <div className="text-left">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#10B981] text-[#10B981]" />
                ))}
                <span className="text-xs font-bold text-white ml-1">4.9/5</span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                from 1,200+ learners
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Column — Three.js Orbital Experience matching reference image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-6 relative flex items-center justify-center"
        >
          <MockMateOrbital />
        </motion.div>
      </div>
    </section>
  );
};
