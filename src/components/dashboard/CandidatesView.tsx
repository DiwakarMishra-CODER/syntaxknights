"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  Calendar,
  Sun,
  Moon,
  X,
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

export default function CandidatesView({ candidates }: { candidates: Candidate[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleViewProfile = (id: string) => {
    router.push(`/candidates/${id}`);
  };

  const roles = useMemo(() => {
    const unique = Array.from(new Set(candidates.map((c) => c.member.jobRole)));
    return ["ALL", ...unique];
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        c.member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.member.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.member.jobRole.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = selectedRole === "ALL" || c.member.jobRole === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [candidates, searchQuery, selectedRole]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050806] text-slate-900 dark:text-[#F5F7F4] font-sans relative overflow-hidden selection:bg-[#1FD16A]/25 selection:text-accent transition-colors duration-300">

      {/* Ambient Background Glows — identical to Dashboard */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#1FD16A]/5 dark:bg-[#1FD16A]/8 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] bg-[#73F0A0]/3 dark:bg-[#73F0A0]/5 blur-[140px] rounded-full" />
      </div>

      {/* Header — identical tokens to Dashboard */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/5 bg-white/70 dark:bg-[#080D0A]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Brand + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#1FD16A]/10 border border-emerald-200 dark:border-[#1FD16A]/30 flex items-center justify-center text-emerald-600 dark:text-[#1FD16A] font-mono font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
                M
              </div>
              <span className="font-sans font-bold text-base tracking-tight text-slate-900 dark:text-white">
                MockMate
              </span>
            </button>
            <span className="text-slate-300 dark:text-white/20">/</span>
            <span className="text-xs font-mono text-emerald-600 dark:text-[#1FD16A] font-medium">
              All Candidates
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-[#8B968F] hover:text-emerald-600 dark:hover:text-accent transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>

            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F1712] text-slate-600 dark:text-[#D6E0D9] hover:bg-slate-100 dark:hover:bg-[#16221B] transition-colors shadow-sm"
                title="Toggle Theme"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-accent-soft" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8">

        {/* Page Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-emerald-50 dark:bg-[#1FD16A]/10 text-emerald-700 dark:text-[#1FD16A] border border-emerald-200/80 dark:border-[#1FD16A]/25 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1FD16A] animate-pulse" />
              Evaluation Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-slate-900 dark:text-[#F5F7F4]">
              All Candidates
            </h1>
            <p className="text-sm text-slate-500 dark:text-[#A4B3A9] mt-1">
              {filteredCandidates.length} of {candidates.length} candidates · Select any profile to inspect mission telemetry.
            </p>
          </div>
        </div>

        {/* Toolbar: Search + Role Filters */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0B120E]/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 dark:text-[#8B968F]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or role..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm font-sans bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#7E8B84] focus:outline-none focus:border-[#1FD16A] dark:focus:border-[#1FD16A] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 md:pb-0 text-xs scrollbar-none flex-wrap md:flex-nowrap">
            <span className="text-slate-400 dark:text-[#7E8B84] font-mono text-[10px] uppercase mr-1 shrink-0 hidden md:inline">
              Role:
            </span>
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all text-xs ${
                  selectedRole === role
                    ? "bg-[#1FD16A] text-[#050806] font-semibold shadow-[0_0_10px_rgba(31,209,106,0.3)]"
                    : "bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-[#A4B3A9] hover:border-emerald-400 dark:hover:border-[#1FD16A]/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {role === "ALL" ? "All Roles" : role}
              </button>
            ))}
          </div>
        </div>

        {/* Candidates Grid */}
        {filteredCandidates.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#0B120E]/60">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No candidates match your search</h3>
            <p className="text-xs text-slate-500 dark:text-[#8B968F] mt-1">
              Try a different name, ID, or clear the role filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.member.id}
                onClick={() => handleViewProfile(candidate.member.id)}
                className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-[#0B120E]/80 backdrop-blur-xl shadow-sm hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(31,209,106,0.06)] hover:border-emerald-400 dark:hover:border-[#1FD16A]/40 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center font-sans font-bold text-base text-slate-900 dark:text-white shrink-0">
                        {candidate.member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-[#1FD16A] block">
                          {candidate.member.id}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-accent transition-colors truncate">
                          {candidate.member.name}
                        </h3>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-semibold bg-emerald-50 dark:bg-[#1FD16A]/10 text-emerald-700 dark:text-[#1FD16A] border border-emerald-200/60 dark:border-[#1FD16A]/20 shrink-0 ml-1">
                      {candidate.member.status}
                    </span>
                  </div>

                  {/* Meta Info */}
                  <div className="space-y-1.5 mb-4 text-xs text-slate-600 dark:text-[#C5D0C8]">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-[#1FD16A] shrink-0" />
                      <span className="truncate">{candidate.member.jobRole}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-[#1FD16A] shrink-0" />
                      <span>{candidate.member.yearsExperience} yrs exp · {candidate.signals.commitDays} commit days</span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-end mb-1.5 text-xs font-mono">
                    <span className="uppercase tracking-wider text-slate-400 dark:text-[#7E8B84] text-[10px]">Missions</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {candidate.signals.missionsCompleted}{" "}
                      <span className="text-slate-400 dark:text-[#7E8B84] font-normal">/ 31</span>
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 mb-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#1FD16A]"
                      style={{ width: `${(candidate.signals.missionsCompleted / 31) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-[#1FD16A] group-hover:gap-1.5 transition-all">
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
