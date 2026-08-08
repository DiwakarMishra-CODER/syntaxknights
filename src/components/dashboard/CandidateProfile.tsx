"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, GraduationCap, Clock, CheckCircle, AlertTriangle, ShieldAlert, ChevronRight } from "lucide-react";

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

export default function CandidateProfile({ candidate }: { candidate: Candidate }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      router.push(`/interview?candidateId=${candidate.member.id}`);
    }
  }, [countdown, router, candidate.member.id]);

  const handleStartProcess = () => {
    if (confirmed) {
      setCountdown(3);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-editorial relative overflow-hidden selection:bg-[#1FD16A]/25 selection:text-[#1FD16A]">
      {/* Ambient Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] bg-[#1FD16A] opacity-[0.04] blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-[#1FD16A] opacity-[0.03] blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm font-medium text-slate-400 hover:text-slate-50 transition-colors group mb-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Directory
        </button>

        <header className="mb-12 border-b border-white/10 pb-12">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold bg-white/5 border border-white/10 text-white shadow-lg shadow-[#1FD16A]/10">
              {candidate.member.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Welcome, {candidate.member.name}</h1>
              <p className="text-xl text-slate-400 font-sans">{candidate.member.id} • {candidate.member.status}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 font-sans">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
              <Briefcase className="w-5 h-5 text-[#1FD16A]" />
              <span className="text-slate-300 font-medium">{candidate.member.jobRole}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
              <GraduationCap className="w-5 h-5 text-[#1FD16A]" />
              <span className="text-slate-300 font-medium">{candidate.member.yearsExperience} Years Exp</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
              <Clock className="w-5 h-5 text-[#1FD16A]" />
              <span className="text-slate-300 font-medium">{candidate.signals.commitDays} Commit Days</span>
            </div>
          </div>
        </header>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[#1FD16A]" />
            Curriculum Progress
          </h2>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl font-sans">
            <div className="flex justify-between items-end mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Total Missions Completed</span>
              <span className="text-2xl font-bold text-white">
                {candidate.signals.missionsCompleted} <span className="text-slate-500 text-lg">/ 31</span>
              </span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden bg-white/10 mb-8">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#1FD16A] shadow-[0_0_10px_rgba(31,209,106,0.5)]"
                style={{ width: `${(candidate.signals.missionsCompleted / 31) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <h4 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">First Try Success</h4>
                <p className="text-3xl font-bold text-white">{candidate.signals.missionsFirstTry}</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <h4 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Current Status</h4>
                <p className="text-3xl font-bold text-[#1FD16A] capitalize">{candidate.member.status}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-center mt-16">
          <button
            onClick={() => setShowModal(true)}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-slate-950 bg-[#1FD16A] rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(31,209,106,0.3)] hover:shadow-[0_0_50px_rgba(31,209,106,0.5)]"
          >
            <span className="relative z-10 flex items-center text-lg tracking-wide uppercase">
              Initialize Interview
              <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
          </button>
        </div>
      </main>

      {/* Pre-Flight Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 font-sans">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Interview Pre-flight Check</h3>
                <p className="text-sm text-slate-400">Please review the rules before proceeding.</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              {countdown !== null ? (
                /* Countdown State */
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="text-sm font-semibold uppercase tracking-widest text-[#1FD16A] mb-8">Deploying Environment</span>
                  <span className="text-8xl font-editorial font-bold text-white animate-pulse shadow-xl">
                    {countdown}
                  </span>
                </div>
              ) : (
                /* Rules State */
                <>
                  <div className="space-y-6 mb-8">
                    <div className="flex gap-4">
                      <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0" />
                      <div>
                        <h4 className="text-white font-semibold mb-1">No External Assistance</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          You are prohibited from using AI assistants (like ChatGPT or Copilot), search engines, or consulting with other individuals during the interview.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0" />
                      <div>
                        <h4 className="text-white font-semibold mb-1">Active Proctoring</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Your screen focus, tab switching, and typing patterns will be monitored to ensure academic integrity.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-slate-600 text-[#1FD16A] focus:ring-[#1FD16A] focus:ring-offset-slate-900 bg-slate-800"
                    />
                    <span className="text-sm text-slate-300 font-medium select-none">
                      I confirm that I understand the rules and agree to take this interview without external assistance.
                    </span>
                  </label>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {countdown === null && (
              <div className="px-8 py-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartProcess}
                  disabled={!confirmed}
                  className={`px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                    confirmed 
                      ? 'bg-[#1FD16A] text-slate-950 hover:bg-[#1FD16A]/90 shadow-[0_0_15px_rgba(31,209,106,0.2)]' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Confirm & Start
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
