"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, ChevronRight, Briefcase, GraduationCap } from "lucide-react";

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

  const handleViewProfile = (id: string) => {
    router.push(`/candidates/${id}`);
  };

  const filteredCandidates = searchQuery.trim() === "" 
    ? candidates 
    : candidates.filter(c => c.member.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.member.id.toLowerCase().includes(searchQuery.toLowerCase()));

  // Theme Classes for smooth, creative design (Dark Mode Fixed)
  const bgClass = "bg-slate-950";
  const textPrimary = "text-slate-50";
  const textSecondary = "text-slate-400";
  
  // Glassmorphic Card Styles
  const cardBg = "bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-[#1FD16A]/50";
  
  // Hero Search Styles
  const searchInputBg = "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:ring-[#1FD16A] focus:bg-white/10";

  // Buttons
  const primaryBtn = "bg-[#1FD16A] text-slate-950 hover:bg-[#1FD16A]/90 shadow-[0_0_15px_rgba(31,209,106,0.3)]";

  return (
    <div className={`min-h-screen ${bgClass} ${textPrimary} font-editorial selection:bg-[#1FD16A]/25 selection:text-[#1FD16A] relative overflow-hidden`}>
      
      {/* Ambient Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1FD16A] opacity-[0.04] blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[30%] h-[50%] bg-[#1FD16A] opacity-[0.03] blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-16">
          <button
            onClick={() => router.push('/dashboard')}
            className={`flex items-center text-sm font-medium ${textSecondary} hover:${textPrimary} transition-colors group`}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </button>
        </div>

        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
          <div>
            <h1 className={`text-4xl md:text-5xl font-editorial font-bold tracking-tight`}>
              All Candidates
            </h1>
            <p className={`text-lg mt-4 ${textSecondary} max-w-xl`}>
              Browse the complete roster of candidates. View their full profiles and launch technical interviews.
            </p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#1FD16A] transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or ID..."
              className={`w-full pl-12 pr-4 py-4 rounded-xl text-md font-sans border focus:outline-none focus:ring-0 ${searchInputBg} transition-all duration-300 shadow-lg`}
            />
          </div>
        </div>

        {/* Candidates Grid */}
        <div className="animate-in fade-in duration-500 min-h-[500px]">
          {filteredCandidates.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-64 rounded-3xl border border-white/5 bg-white/[0.02]`}>
              <Search className="w-12 h-12 mb-4 text-slate-700" />
              <p className={`font-sans text-lg ${textSecondary}`}>No candidates found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCandidates.map((candidate) => (
                <div 
                  key={candidate.member.id} 
                  className={`rounded-3xl border p-6 flex flex-col transition-all duration-300 ${cardBg} font-sans group`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#1FD16A] group-hover:to-emerald-400 transition-all">
                        {candidate.member.name}
                      </h3>
                      <p className={`text-sm font-medium ${textSecondary}`}>{candidate.member.id}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-white/5 text-white">
                      {candidate.member.name.charAt(0)}
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{candidate.member.jobRole}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{candidate.member.yearsExperience} Years Exp</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Progress</span>
                      <span className="text-sm font-bold text-white">
                        {candidate.signals.missionsCompleted} <span className={textSecondary}>/ 31</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden mb-6 bg-white/10">
                      <div 
                        className="h-full rounded-full bg-[#1FD16A]"
                        style={{ width: `${(candidate.signals.missionsCompleted / 31) * 100}%` }}
                      />
                    </div>
                    
                    <button
                      onClick={() => handleViewProfile(candidate.member.id)}
                      className={`w-full py-3 rounded-xl flex items-center justify-center font-bold text-sm tracking-wide uppercase transition-all duration-300 ${primaryBtn}`}
                    >
                      View Profile
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
