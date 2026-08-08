"use client";

import React, { useState } from "react";

interface AudienceCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  keyBenefit: string;
}

const AUDIENCE_CATEGORIES: AudienceCategory[] = [
  {
    id: "engineers",
    title: "Software Engineers",
    subtitle: "Preparing for L5 / L6 / Staff Technical Rounds",
    description:
      "Practice realistic system design and architecture conversations that probe trade-offs, concurrency, and failure recovery under pressure.",
    badge: "Senior & Staff Level",
    keyBenefit: "Simulate high-stakes interviews with principal engineer rigor.",
  },
  {
    id: "students",
    title: "Students & Graduates",
    subtitle: "Transitioning to Industry Engineering Roles",
    description:
      "Bridge the gap between theoretical computer science and production software engineering through adaptive interactive dialogue.",
    badge: "Early Career",
    keyBenefit: "Build confidence answering open-ended system design questions.",
  },
  {
    id: "job-seekers",
    title: "Active Job Seekers",
    subtitle: "Accelerating Preparation Across Companies",
    description:
      "Conduct target-company specific mock rounds with instant feedback on communication clarity, technical depth, and architectural instincts.",
    badge: "Interview Ready",
    keyBenefit: "Get detailed actionable feedback after every single 45-min session.",
  },
  {
    id: "hiring-teams",
    title: "Hiring Teams",
    subtitle: "Calibrating Candidate Interview Benchmarks",
    description:
      "Establish consistent, objective evaluation standards for technical hiring without burning out senior engineering interviewers.",
    badge: "Enterprise & Scale",
    keyBenefit: "Eliminate interviewer bias and standardize technical rubrics.",
  },
  {
    id: "universities",
    title: "Universities",
    subtitle: "Empowering CS Cohorts & Departments",
    description:
      "Equip computer science students with self-serve adaptive mock interview tools that scale across entire graduating cohorts.",
    badge: "Academia",
    keyBenefit: "Track cohort readiness with centralized architectural analytics.",
  },
  {
    id: "placement-programs",
    title: "Placement Programs",
    subtitle: "Bootcamps & Career Accelerators",
    description:
      "Provide high-touch technical interview coaching at scale with comprehensive post-interview feedback dossiers for mentors.",
    badge: "Accelerators",
    keyBenefit: "Boost placement rates with realistic interview simulations.",
  },
];

export const TargetAudience: React.FC = () => {
  const [filter, setFilter] = useState<string>("all");

  const filteredCategories =
    filter === "all"
      ? AUDIENCE_CATEGORIES
      : AUDIENCE_CATEGORIES.filter((c) => c.id === filter);

  return (
    <section id="audience" className="py-24 relative z-10 border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="pill-badge pill-badge-ice">
            <span>TAILORED EXPERIENCES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans text-white tracking-tight">
            Who It&apos;s <span className="italic text-[var(--accent-ice-blue)]">Built For</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            From individual engineers preparing for tier-one tech interviews to university cohorts and hiring teams calibrating candidate depth.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-xs font-mono transition-all ${
              filter === "all"
                ? "bg-white text-[#0B1220] font-bold shadow-md"
                : "glass-panel text-slate-400 hover:text-white"
            }`}
          >
            All Roles
          </button>
          {AUDIENCE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-mono transition-all ${
                filter === cat.id
                  ? "bg-[var(--accent-emerald)] text-[#0B1220] font-bold shadow-md"
                  : "glass-panel text-slate-400 hover:text-white"
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Minimal Elegant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((item) => (
            <div
              key={item.id}
              className="glass-panel glass-panel-interactive rounded-3xl p-8 text-left flex flex-col justify-between border border-[var(--glass-border)] bg-slate-900/60 hover:bg-slate-900/90 group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-[10px] font-mono text-[var(--accent-emerald)] border border-slate-700">
                    {item.badge}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 group-hover:text-[var(--accent-emerald)] transition-colors">
                    ↗
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-[var(--accent-emerald)] transition-colors">
                  {item.title}
                </h3>
                <div className="text-xs font-mono text-[var(--accent-ice-blue)]">
                  {item.subtitle}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-400">
                <span className="text-[var(--accent-emerald)]">Key Benefit:</span> {item.keyBenefit}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
