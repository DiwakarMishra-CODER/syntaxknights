"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SKILLS = [
  { name: "Retrieval", score: 88, color: "#10B981" },
  { name: "RAG", score: 84, color: "#10B981" },
  { name: "Agents", score: 92, color: "#10B981" },
  { name: "MCP", score: 71, color: "#F59E0B" },
  { name: "Security", score: 64, color: "#F43F5E" },
  { name: "Production", score: 81, color: "#38BDF8" },
];

export const ReadinessAssessment: React.FC = () => {
  const [readinessScore, setReadinessScore] = useState(0);
  const [animateProgress, setAnimateProgress] = useState(false);

  return (
    <section id="readiness" className="py-24 bg-[#F8FAFC] text-[#0F172A] relative z-10 text-left">
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column matching reference image */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          onViewportEnter={() => {
            setAnimateProgress(true);
            let val = 0;
            const timer = setInterval(() => {
              val += 2;
              if (val >= 82) {
                setReadinessScore(82);
                clearInterval(timer);
              } else {
                setReadinessScore(val);
              }
            }, 25);
          }}
          className="lg:col-span-5 space-y-6"
        >
          <span className="text-xs font-mono font-semibold tracking-widest uppercase text-[#10B981]">
            WHAT YOU GET
          </span>
          
          <h2 className="text-4xl sm:text-5xl font-editorial text-[#0F172A] tracking-tight leading-tight">
            A clear map of your <br />
            <span className="italic font-normal text-[#10B981]">readiness.</span>
          </h2>
          
          <p className="text-base text-slate-600 font-sans leading-relaxed">
            Detailed, evidence-backed feedback across the skills that matter.
          </p>

          <a
            href="#dossier"
            className="inline-flex items-center text-sm font-semibold text-[#10B981] hover:underline pt-2 group"
          >
            View sample report
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>

        {/* Right Column — Dark Assessment Card matching reference image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7"
        >
          <div className="bg-[#0B101D] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-left grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left Score & Progress Bars */}
            <div className="md:col-span-7 space-y-6">
              {/* Overall Readiness Header */}
              <div className="space-y-1 border-b border-slate-800 pb-5">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Overall Readiness
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-editorial font-bold text-white tracking-tight">
                    {readinessScore}
                  </span>
                  <span className="text-lg font-editorial text-slate-400">/ 100</span>
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded text-xs font-mono font-semibold text-[#10B981] bg-[#10B981]/10 mt-1">
                  Strong
                </span>
                
                {/* Main Progress Bar */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-[#10B981] transition-all duration-1000 ease-out"
                    style={{ width: `${animateProgress ? 82 : 0}%` }}
                  />
                </div>
              </div>

              {/* Skill Breakdown */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Skill Breakdown
                </div>
                {SKILLS.map((sk, idx) => (
                  <div key={sk.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">{sk.name}</span>
                      <span className="text-slate-400 font-semibold">{sk.score}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${animateProgress ? sk.score : 0}%`,
                          backgroundColor: sk.color,
                          transitionDelay: `${idx * 100}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Strengths & Areas to Improve */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-6 md:border-l md:border-slate-800 md:pl-6">
              <div className="space-y-6">
                {/* Top Strengths */}
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Top Strengths
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                      Retrieval
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                      Agents
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                      RAG
                    </span>
                  </div>
                </div>

                {/* Areas to Improve */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Areas to Improve
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      MCP
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      Security
                    </span>
                  </div>
                </div>
              </div>

              {/* View Full Report Button */}
              <div className="pt-4">
                <button
                  onClick={() => alert("Full report dossier requested!")}
                  className="w-full btn-ghost-dark text-xs py-2.5 justify-center"
                >
                  View full report →
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
