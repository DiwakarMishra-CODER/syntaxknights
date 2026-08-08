"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, BookOpen, Search, ArrowLeft, Sun, Moon, ChevronRight, Briefcase, GraduationCap } from "lucide-react";

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
  modules: any[];
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
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleViewProfile = (id: string) => {
    router.push(`/candidates/${id}`);
  };

  const filteredCandidates = searchQuery.trim() === "" 
    ? [] // Empty by default for privacy
    : candidates.filter(c => c.member.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.member.id.toLowerCase().includes(searchQuery.toLowerCase()));

  // Theme Classes for smooth, creative design
  const bgClass = isDarkMode ? "bg-slate-950" : "bg-slate-50";
  const textPrimary = isDarkMode ? "text-slate-50" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  
  // Glassmorphic Card Styles
  const cardBg = isDarkMode 
    ? "bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-[#1FD16A]/50" 
    : "bg-white border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10";
  
  // Hero Search Styles
  const searchInputBg = isDarkMode 
    ? "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:ring-[#1FD16A] focus:bg-white/10" 
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-emerald-500";

  // Buttons
  const primaryBtn = isDarkMode 
    ? "bg-[#1FD16A] text-slate-950 hover:bg-[#1FD16A]/90 shadow-[0_0_15px_rgba(31,209,106,0.3)]" 
    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm";
  
  const outlineBtn = isDarkMode
    ? "bg-white/5 text-white border border-white/10 hover:bg-white/10"
    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50";

  return (
    <div className={`min-h-screen ${bgClass} ${textPrimary} font-editorial transition-colors duration-500 selection:bg-[#1FD16A]/25 selection:text-[#1FD16A] relative overflow-hidden`}>
      
      {/* Ambient Background Glows (Dark Mode Only) */}
      {isDarkMode && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1FD16A] opacity-[0.04] blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute top-[40%] right-[-10%] w-[30%] h-[50%] bg-[#1FD16A] opacity-[0.03] blur-[100px] rounded-full mix-blend-screen" />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        
        {/* Top Navigation & Theme Toggle */}
        <div className="flex justify-between items-center mb-16">
          <button
            onClick={() => router.push('/')}
            className={`flex items-center text-sm font-medium ${textSecondary} hover:${textPrimary} transition-colors group`}
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </button>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/candidates')}
              className={`flex items-center text-sm font-medium px-5 py-2.5 rounded-full transition-all ${outlineBtn}`}
            >
              <Users className="w-4 h-4 mr-2" />
              View All Candidates
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 rounded-full transition-all ${outlineBtn}`}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-slate-300" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Hero Section & Massive Search */}
        <div className="flex flex-col items-center text-center mb-12 max-w-3xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-widest mb-6 ${isDarkMode ? 'bg-[#1FD16A]/10 text-[#1FD16A]' : 'bg-emerald-100 text-emerald-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#1FD16A]' : 'bg-emerald-500'} animate-pulse`} />
            {curriculum.cohort}
          </div>
          <h1 className={`text-5xl md:text-6xl font-editorial font-bold tracking-tight mb-6`}>
            Candidate Directory
          </h1>
          <p className={`text-lg md:text-xl mb-10 ${textSecondary} max-w-2xl`}>
            Search securely by name or ID to review candidate profiles and launch technical interviews.
          </p>

          <div className="relative w-full group max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className={`h-6 w-6 ${isDarkMode ? 'text-slate-400 group-focus-within:text-[#1FD16A]' : 'text-slate-400 group-focus-within:text-emerald-500'} transition-colors`} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or ID to reveal..."
              className={`w-full pl-16 pr-6 py-5 rounded-2xl text-lg font-sans border-2 focus:outline-none focus:ring-0 ${searchInputBg} transition-all duration-300 shadow-lg`}
            />
          </div>
        </div>

        {/* Dynamic Content Area */}
        {searchQuery.trim() === "" ? (
          /* Default State: Show Horizontal Curriculum */
          <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className={`rounded-3xl border p-8 ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'} font-sans relative overflow-hidden`}>
                <div className="flex flex-col items-center text-center mb-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-[#1FD16A]/10 text-[#1FD16A]' : 'bg-emerald-100 text-emerald-600'}`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-2xl tracking-wide">Curriculum Focus</h3>
                  <p className={`text-sm mt-2 max-w-md ${textSecondary}`}>
                    Tracking {curriculum.modules.length} key modules encompassing AI engineering, agent architectures, and production deployments.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                  {curriculum.modules.map((mod, i) => (
                    <div key={mod.n} className={`p-6 rounded-2xl border transition-colors ${isDarkMode ? 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-emerald-200'} shadow-sm flex flex-col items-start`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mb-4 ${isDarkMode ? 'bg-[#1FD16A]/20 text-[#1FD16A]' : 'bg-emerald-100 text-emerald-700'}`}>
                        M{mod.n}
                      </div>
                      <h4 className="text-lg font-semibold mb-2">{mod.title}</h4>
                      <span className={`text-[11px] uppercase font-bold tracking-widest mt-auto pt-4 ${textSecondary}`}>Days {mod.days[0]}-{mod.days[1]}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        ) : (
          /* Search State: Show Candidates */
          <div className="animate-in fade-in duration-500">
            {filteredCandidates.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-64 rounded-3xl border mt-8 ${isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
                <Search className={`w-12 h-12 mb-4 ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`} />
                <p className={`font-sans text-lg ${textSecondary}`}>No candidates found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
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
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {candidate.member.name.charAt(0)}
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3">
                        <Briefcase className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        <span className="text-sm">{candidate.member.jobRole}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <GraduationCap className={`w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        <span className="text-sm">{candidate.member.yearsExperience} Years Exp • {candidate.member.education}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-2">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Progress</span>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {candidate.signals.missionsCompleted} <span className={textSecondary}>/ 31</span>
                        </span>
                      </div>
                      <div className={`h-1.5 w-full rounded-full overflow-hidden mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                        <div 
                          className={`h-full rounded-full ${isDarkMode ? 'bg-[#1FD16A]' : 'bg-emerald-500'}`}
                          style={{ width: `${(candidate.signals.missionsCompleted / 31) * 100}%` }}
                        />
                      </div>
                      
                      <button
                        onClick={() => handleViewProfile(candidate.member.id)}
                        className={`w-full py-3.5 rounded-xl flex items-center justify-center font-bold text-sm tracking-wide uppercase transition-all duration-300 ${primaryBtn}`}
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
        )}

      </main>
    </div>
  );
}
