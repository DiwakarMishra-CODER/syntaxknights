"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  GraduationCap, 
  Sun, 
  Moon, 
  BookOpen, 
  CheckCircle2, 
  Calendar,
  X
} from "lucide-react";

type Candidate = {
  member: {
    id: string;
    name: string;
    jobRole: string;
    yearsExperience: number;
    education: string;
    status: string;
  };
  signals: {
    commitDays: number;
    missionsCompleted: number;
    missionsFirstTry: number;
  };
  missions: any[];
};

type Curriculum = {
  cohort: string;
  modules: {
    n: number;
    title: string;
    days: [number, number];
  }[];
  days: any[];
};

export default function Dashboard({
  candidates,
  curriculum,
}: {
  candidates: Candidate[];
  curriculum: Curriculum;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleViewProfile = (id: string) => {
    router.push(`/candidates/${id}`);
  };

  const isFiltering = searchQuery.trim() !== "";

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return candidates.filter((c) =>
      c.member.name.toLowerCase().includes(q) ||
      c.member.id.toLowerCase().includes(q) ||
      c.member.jobRole.toLowerCase().includes(q) ||
      c.member.education.toLowerCase().includes(q)
    );
  }, [candidates, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050806] text-slate-900 dark:text-[#F5F7F4] font-sans relative overflow-hidden selection:bg-[#1FD16A]/25 selection:text-brand transition-colors duration-300">
      
      {/* Ambient Background Glows matching landing page aesthetic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#1FD16A]/5 dark:bg-[#1FD16A]/8 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] bg-[#73F0A0]/3 dark:bg-[#73F0A0]/5 blur-[140px] rounded-full" />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/5 bg-white/70 dark:bg-[#080D0A]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand / Home Link */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#1FD16A]/10 border border-emerald-200 dark:border-[#1FD16A]/30 flex items-center justify-center text-emerald-600 dark:text-brand font-mono font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
              M
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-base tracking-tight text-slate-900 dark:text-white">
                MockMate
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#1FD16A]/10 text-emerald-700 dark:text-brand border border-emerald-200/60 dark:border-[#1FD16A]/20">
                Dashboard
              </span>
            </div>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-[#8B968F] hover:text-emerald-600 dark:hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>

            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F1712] text-slate-600 dark:text-[#D6E0D9] hover:bg-slate-100 dark:hover:bg-[#16221B] transition-colors shadow-sm"
                title="Toggle Theme"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-brand-soft" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 relative z-10 space-y-12">
        
        {/* Hero & Big Search Bar Section */}
        <section className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
          
          {/* Cohort Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-emerald-50 dark:bg-[#1FD16A]/10 text-emerald-700 dark:text-brand border border-emerald-200/80 dark:border-[#1FD16A]/25 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#1FD16A] animate-pulse" />
            {curriculum.cohort} • Evaluation Portal
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-bold tracking-tight text-slate-900 dark:text-[#F5F7F4] leading-[1.1]">
            Interview Roster
          </h1>
          
          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-[#A4B3A9] max-w-2xl font-sans">
            Search candidates by name or ID to review verified code signals and launch adaptive mock interviews.
          </p>

          {/* Big Search Bar */}
          <div className="w-full relative group pt-2">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400 dark:text-[#8B968F] group-focus-within:text-brand transition-colors" />
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name or ID (e.g. CAND-001)..."
              className="w-full pl-14 pr-12 py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-sans bg-white dark:bg-[#0B120E]/90 border-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#7E8B84] shadow-lg dark:shadow-[0_0_30px_rgba(0,0,0,0.4)] focus:outline-none focus:border-[#1FD16A] dark:focus:border-[#1FD16A] transition-all duration-300"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                title="Clear Search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* View All Candidates Button */}
          <button
            onClick={() => router.push('/candidates')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-sans font-semibold transition-all duration-200 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-[#C5D0C8] hover:border-emerald-400 dark:hover:border-[#1FD16A]/50 hover:text-emerald-600 dark:hover:text-brand shadow-sm"
          >
            <span>View All Candidates ({candidates.length})</span>
          </button>
        </section>

        {/* Dynamic Display Area */}
        {!isFiltering ? (
          /* Default State: Show Curriculum Focus */
          <section className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0B120E]/80 backdrop-blur-xl shadow-sm">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-emerald-50 dark:bg-[#1FD16A]/10 text-emerald-600 dark:text-brand border border-emerald-200/80 dark:border-[#1FD16A]/20">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-sans font-bold text-slate-900 dark:text-[#F5F7F4]">
                  Curriculum Mastery Scope
                </h2>
                <p className="text-sm text-slate-500 dark:text-[#A4B3A9] mt-1 max-w-md">
                  Tracking {curriculum.modules.length} core engineering modules across AI systems, autonomous agents, and production infrastructure.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {curriculum.modules.map((mod) => (
                  <div
                    key={mod.n}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col justify-between hover:border-emerald-400/50 dark:hover:border-[#1FD16A]/30 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs bg-emerald-100 dark:bg-[#1FD16A]/15 text-emerald-700 dark:text-brand">
                          M{mod.n}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#7E8B84]">
                          Days {mod.days[0]}–{mod.days[1]}
                        </span>
                      </div>
                      <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-[#F5F7F4] leading-snug group-hover:text-emerald-600 dark:group-hover:text-brand transition-colors">
                        {mod.title}
                      </h3>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400 dark:text-[#7E8B84]">
                      <span>Checkpoints verified</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-brand" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Helper Prompt */}
            <div className="text-center py-6">
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-[#7E8B84]">
                Search by name or ID · or click &ldquo;View All Candidates&rdquo; to browse
              </p>
            </div>
          </section>
        ) : (
          /* Filtered Candidates Grid (Showing actual student names) */
          <section className="space-y-6 pt-2 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-[#8B968F]">
                Matching Candidates ({filteredCandidates.length})
              </span>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-mono text-emerald-600 dark:text-brand hover:underline"
              >
                Clear
              </button>
            </div>

            {filteredCandidates.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#0B120E]/60">
                <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No candidate found matching &ldquo;{searchQuery}&rdquo;
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#8B968F] mt-1">
                  Try searching by name, role or ID like <code className="font-mono text-emerald-600">CAND-001</code>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.member.id}
                    className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-[#0B120E]/80 backdrop-blur-xl shadow-sm hover:shadow-md dark:hover:shadow-[0_0_25px_rgba(31,209,106,0.06)] hover:border-emerald-400 dark:hover:border-[#1FD16A]/40 transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header: Candidate Name, Initial Avatar, ID & Status */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center font-sans font-bold text-base text-slate-900 dark:text-white">
                            {candidate.member.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-brand transition-colors">
                              {candidate.member.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-mono text-emerald-600 dark:text-brand font-medium">
                                {candidate.member.id}
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className="text-xs text-slate-500 dark:text-[#8B968F] font-medium truncate max-w-[140px]">
                                {candidate.member.jobRole}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-semibold bg-emerald-50 dark:bg-[#1FD16A]/10 text-emerald-700 dark:text-brand border border-emerald-200/60 dark:border-[#1FD16A]/20">
                          {candidate.member.status}
                        </span>
                      </div>

                      {/* Candidate Meta Info */}
                      <div className="space-y-2 py-3 border-y border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-[#C5D0C8]">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-brand shrink-0" />
                          <span className="truncate">{candidate.member.yearsExperience} Yrs Exp • {candidate.member.education}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-brand shrink-0" />
                          <span>{candidate.signals.commitDays} Active Commit Days</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Action */}
                    <div className="mt-5 pt-2">
                      <div className="flex justify-between items-end mb-1.5 text-xs">
                        <span className="text-[11px] font-mono uppercase text-slate-400 dark:text-[#7E8B84]">
                          Missions Completed
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {candidate.signals.missionsCompleted} <span className="text-slate-400 dark:text-[#7E8B84] font-normal">/ 31</span>
                        </span>
                      </div>

                      <div className="h-1.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 mb-4">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#1FD16A]"
                          style={{ width: `${(candidate.signals.missionsCompleted / 31) * 100}%` }}
                        />
                      </div>

                      <button
                        onClick={() => handleViewProfile(candidate.member.id)}
                        className="w-full py-2.5 rounded-xl text-xs font-sans font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-emerald-600 text-slate-800 hover:text-white dark:bg-white/5 dark:hover:bg-[#1FD16A] dark:text-[#E2E8F0] dark:hover:text-[#050806] border border-slate-200 dark:border-white/5 dark:hover:border-transparent transition-all duration-200"
                      >
                        <span>View Evaluation Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
}
