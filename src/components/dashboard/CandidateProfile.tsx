"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  ArrowLeft, 
  Briefcase, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ChevronRight, 
  Sun, 
  Moon, 
  Sparkles, 
  Activity, 
  Award,
  Calendar,
  Layers,
  ArrowUpRight
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

export default function CandidateProfile({ candidate }: { candidate: Candidate }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#050806] text-slate-900 dark:text-[#F5F7F4] font-sans relative overflow-hidden selection:bg-[#1FD16A]/25 selection:text-brand transition-colors duration-300">
      
      {/* Ambient Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#1FD16A]/5 dark:bg-[#1FD16A]/8 blur-[160px] rounded-full" />
      </div>

      {/* Console Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/5 bg-white/70 dark:bg-[#080D0A]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-[#8B968F] hover:text-emerald-600 dark:hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="font-sans">Dashboard</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-xs font-mono text-emerald-600 dark:text-brand font-medium">
              Candidate {candidate.member.id}
            </span>
          </div>

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
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8">
        
        {/* Candidate Profile Header Card */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#0B120E]/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 mb-6 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-sans font-bold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm">
                {candidate.member.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-medium text-emerald-600 dark:text-brand">
                    {candidate.member.id}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-semibold bg-emerald-50 dark:bg-[#1FD16A]/10 text-emerald-700 dark:text-brand border border-emerald-200/60 dark:border-[#1FD16A]/20">
                    {candidate.member.status}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-slate-900 dark:text-[#F5F7F4]">
                  {candidate.member.name}
                </h1>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-sans font-semibold text-xs uppercase tracking-wider bg-[#1FD16A] text-[#050806] hover:bg-[#73F0A0] transition-all shadow-[0_0_20px_rgba(31,209,106,0.3)] self-start sm:self-auto active:scale-95"
            >
              <span>Launch Mock Session</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70">
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-brand shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase text-slate-400">Target Role</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{candidate.member.jobRole}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70">
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-brand shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase text-slate-400">Background</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{candidate.member.yearsExperience} Yrs Exp • {candidate.member.education}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-brand shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase text-slate-400">Activity</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{candidate.signals.commitDays} Commit Days</div>
              </div>
            </div>
          </div>
        </section>

        {/* Telemetry Matrix */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800/80 shadow-sm">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Missions Completed</span>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {candidate.signals.missionsCompleted} <span className="text-xs font-normal text-slate-400">/ 31</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 mt-3">
              <div
                className="h-full rounded-full bg-emerald-500 dark:bg-[#1FD16A]"
                style={{ width: `${(candidate.signals.missionsCompleted / 31) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800/80 shadow-sm">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Clean First-Try Submissions</span>
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {candidate.signals.missionsFirstTry} <span className="text-xs font-normal text-slate-400">missions</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-2">
              High code precision
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800/80 shadow-sm">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Evaluation Readiness</span>
            <div className="text-2xl font-sans font-bold text-emerald-600 dark:text-brand flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Calibrated
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-2">
              Telemetry synched
            </div>
          </div>
        </section>

        {/* Mission Evaluation History */}
        {candidate.missions && candidate.missions.length > 0 && (
          <section className="p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Sample Mission Checkpoints</h2>
              <span className="text-xs font-mono text-slate-400">Day by Day Highlights</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidate.missions.map((m: any, idx: number) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <span className="font-mono font-semibold text-emerald-600 dark:text-brand">D{m.day}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{m.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.passed && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-brand bg-emerald-50 dark:bg-[#1FD16A]/10 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-[#1FD16A]/20">
                        {m.attempts} {m.attempts === 1 ? 'try' : 'tries'}
                      </span>
                    )}
                    {m.skipped && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        Skipped
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Full-screen Launch Overlay (shown during countdown) */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#050806] overflow-hidden transition-colors duration-300">
          {/* Ambient Glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/5 dark:bg-[#1FD16A]/8 blur-[180px] rounded-full" />
            <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-emerald-300/5 dark:bg-[#73F0A0]/4 blur-[120px] rounded-full" />
          </div>

          {/* Pulsing Ring */}
          <div className="relative flex items-center justify-center mb-12">
            <div className="absolute w-48 h-48 rounded-full border border-emerald-400/30 dark:border-[#1FD16A]/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute w-36 h-36 rounded-full border border-emerald-400/40 dark:border-[#1FD16A]/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.25s' }} />
            <div className="absolute w-24 h-24 rounded-full border border-emerald-400/50 dark:border-[#1FD16A]/40 animate-ping" style={{ animationDuration: '1s', animationDelay: '0.5s' }} />
            
            {/* Center Countdown */}
            <div className="relative w-32 h-32 rounded-full bg-white dark:bg-[#0B120E] border border-emerald-300 dark:border-[#1FD16A]/30 flex items-center justify-center shadow-[0_0_60px_rgba(31,209,106,0.12)] dark:shadow-[0_0_60px_rgba(31,209,106,0.15)]">
              <span className="text-6xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {countdown}
              </span>
            </div>
          </div>

          {/* Candidate Info */}
          <div className="relative z-10 flex flex-col items-center gap-3 text-center px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-emerald-50 dark:bg-[#1FD16A]/10 text-emerald-700 dark:text-brand border border-emerald-200 dark:border-[#1FD16A]/25 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#1FD16A] animate-pulse" />
              Launching Session
            </div>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 dark:text-white tracking-tight">
              {candidate.member.name}
            </h2>
            <p className="text-sm font-mono text-slate-500 dark:text-[#8B968F]">
              {candidate.member.id} · {candidate.member.jobRole}
            </p>

            <div className="mt-6 text-xs font-mono uppercase tracking-[0.2em] text-slate-400 dark:text-[#8B968F]">
              {countdown === 3 && "Calibrating adaptive question engine…"}
              {countdown === 2 && "Loading candidate telemetry signals…"}
              {countdown === 1 && "Entering evaluation room…"}
              {countdown === 0 && "Starting now…"}
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 dark:from-[var(--bg-void)] to-transparent pointer-events-none" />
        </div>
      )}

      {/* Pre-Flight Modal */}
      {showModal && countdown === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B120E] border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Interview Pre-flight Check</h3>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-[#7E8B84]">Candidate Protocol</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Independent Execution</h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#8B968F] mt-0.5 leading-relaxed">
                      AI assistants are restricted. Questions adapt to real-time candidate code signals.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                  <Activity className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Real-Time Telemetry</h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#8B968F] mt-0.5 leading-relaxed">
                      Code edits and technical reasoning will be streamed into the scoring rubric.
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 cursor-pointer hover:border-emerald-500/50 dark:hover:border-[#1FD16A]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-900"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 select-none font-medium leading-relaxed">
                  I understand the rules and agree to begin the evaluation session.
                </span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex justify-end gap-2.5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartProcess}
                disabled={!confirmed}
                className={`px-5 py-2 rounded-lg text-xs font-sans font-semibold uppercase tracking-wider transition-all ${
                  confirmed 
                    ? 'bg-[#1FD16A] text-[#050806] hover:bg-[#73F0A0] shadow-[0_0_16px_rgba(31,209,106,0.3)]' 
                    : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-[#7E8B84] cursor-not-allowed'
                }`}
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
