"use client";

import React, { useState } from "react";

interface PricingSectionProps {
  onOpenStartModal: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onOpenStartModal,
}) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <section id="pricing" className="py-24 relative z-10 border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="pill-badge pill-badge-champagne">
            <span>TRANSPARENT PRICING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-editorial text-white tracking-tight">
            Invest In <span className="italic text-[var(--accent-champagne)]">Your Career</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Unlimited adaptive mock rounds, detailed architectural dossiers, and real-time reasoning feedback.
          </p>

          {/* Cycle Switcher */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-mono ${billingCycle === "monthly" ? "text-white font-bold" : "text-slate-400"}`}>
              Monthly
            </span>
            <button
              onClick={() =>
                setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
              }
              className="w-12 h-6 rounded-full bg-slate-800 p-1 border border-slate-700 relative transition-colors focus:outline-none"
            >
              <div
                className={`w-4 h-4 rounded-full bg-[var(--accent-emerald)] transition-transform duration-200 ${
                  billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"
                }`}
              ></div>
            </button>
            <span className={`text-xs font-mono ${billingCycle === "yearly" ? "text-white font-bold" : "text-slate-400"}`}>
              Yearly <span className="text-[var(--accent-emerald)] font-bold">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Starter */}
          <div className="glass-panel rounded-3xl p-8 border border-[var(--glass-border)] bg-slate-900/60 flex flex-col justify-between text-left">
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                STARTER
              </div>
              <div className="text-3xl font-bold text-white font-mono mb-2">
                {billingCycle === "monthly" ? "$29" : "$23"}
                <span className="text-sm font-normal text-slate-400">/mo</span>
              </div>
              <p className="text-xs text-slate-300 mb-6">
                Ideal for targeted preparation before upcoming interview loops.
              </p>
              <ul className="space-y-3 text-xs text-slate-300 mb-8 border-t border-slate-800 pt-6">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--accent-emerald)]">✓</span> 5 Full Adaptive Mock Rounds / mo
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--accent-emerald)]">✓</span> System Design & Backend Tracks
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--accent-emerald)]">✓</span> Instant Feedback Reports
                </li>
              </ul>
            </div>
            <button
              onClick={onOpenStartModal}
              className="btn-secondary w-full text-xs py-3 text-center justify-center"
            >
              Start Free Trial
            </button>
          </div>

          {/* Card 2: Pro (Featured) */}
          <div className="glass-panel rounded-3xl p-8 border border-[var(--accent-emerald-border)] bg-[var(--accent-emerald-glow)] flex flex-col justify-between text-left relative shadow-2xl scale-105">
            <div className="absolute top-0 right-0 px-3 py-1 bg-[var(--accent-emerald)] text-[#0B1220] text-[10px] font-mono font-bold rounded-bl-xl">
              POPULAR
            </div>
            <div>
              <div className="text-xs font-mono text-[var(--accent-emerald)] uppercase tracking-wider mb-2 font-bold">
                PRO ENGINEER
              </div>
              <div className="text-4xl font-bold text-white font-mono mb-2">
                {billingCycle === "monthly" ? "$59" : "$47"}
                <span className="text-sm font-normal text-slate-300">/mo</span>
              </div>
              <p className="text-xs text-slate-200 mb-6">
                Unlimited practice with deep architectural probes & senior feedback.
              </p>
              <ul className="space-y-3 text-xs text-white mb-8 border-t border-emerald-500/20 pt-6">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--accent-emerald)] font-bold">✓</span> Unlimited Mock Interviews
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--accent-emerald)] font-bold">✓</span> All Senior & Staff Tracks
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--accent-emerald)] font-bold">✓</span> Full Architectural Dossiers
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--accent-emerald)] font-bold">✓</span> Custom Domain Configuration
                </li>
              </ul>
            </div>
            <button
              onClick={onOpenStartModal}
              className="btn-primary w-full text-xs py-3.5 text-center justify-center font-bold"
            >
              Get Started Now
            </button>
          </div>

          {/* Card 3: Teams */}
          <div className="glass-panel rounded-3xl p-8 border border-[var(--glass-border)] bg-slate-900/60 flex flex-col justify-between text-left">
            <div>
              <div className="text-xs font-mono text-[var(--accent-ice-blue)] uppercase tracking-wider mb-2 font-semibold">
                TEAMS & UNIVERSITIES
              </div>
              <div className="text-3xl font-bold text-white font-mono mb-2">
                Custom
              </div>
              <p className="text-xs text-slate-300 mb-6">
                For hiring teams, bootcamps, and university computer science departments.
              </p>
              <ul className="space-y-3 text-xs text-slate-300 mb-8 border-t border-slate-800 pt-6">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--accent-ice-blue)]">✓</span> Centralized Cohort Analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--accent-ice-blue)]">✓</span> Custom Rubrics & Scenarios
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--accent-ice-blue)]">✓</span> SSO & Enterprise Security
                </li>
              </ul>
            </div>
            <button
              onClick={onOpenStartModal}
              className="btn-secondary w-full text-xs py-3 text-center justify-center"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
