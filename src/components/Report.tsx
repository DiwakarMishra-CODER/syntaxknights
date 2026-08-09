"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Zap,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  History,
  AlertOctagon,
} from "lucide-react";
import { topicFindings } from "@/lib/summary";
import { deriveSignals } from "@/lib/signals";
import type { Candidate, Feedback, FocusDay, Turn } from "@/lib/types";
import type { PanelData } from "./Panel";

export type ReportPanel = Pick<
  PanelData,
  "topics" | "unjustified" | "comparison" | "explanation"
>;

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full overflow-hidden bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
}

/** Calculates overall interview performance grade using super simple, clear friendly terms */
function calculatePerformance(turns: Turn[]) {
  const scored = turns.filter((t) => t.role === "candidate" && t.rubric);
  if (scored.length === 0) return { pct: 80, grade: "Strong Builder ⭐", level: "Great Start" };

  let totalScore = 0;
  let count = 0;

  scored.forEach((t) => {
    if (t.rubric) {
      const avg = (t.rubric.knowledge + t.rubric.communication + t.rubric.specificity) / 3;
      totalScore += avg;
      count++;
    }
  });

  const avgScore = count > 0 ? totalScore / count : 3;
  const pct = Math.round((avgScore / 5) * 100);

  if (pct >= 85) return { pct, grade: "Top Star Builder ⭐", level: "Super Strong" };
  if (pct >= 70) return { pct, grade: "Strong System Builder 👍", level: "Great Job" };
  if (pct >= 55) return { pct, grade: "Good Start, Keep Building 🛠️", level: "Getting Better" };
  return { pct, grade: "Learning & Growing 🌱", level: "Keep Practicing" };
}

/** Turns raw turns into Q&A pairs for replay view */
function extractQAPairs(turns: Turn[], focusDays: FocusDay[]) {
  const pairs: Array<{
    turnNumber: number;
    question: string;
    answer: string;
    rubric: Turn["rubric"];
    targetDay: number | null;
    depth: number | null;
    topicTitle: string;
  }> = [];

  let lastQuestion: { text: string; targetDay: number | null; depth: number | null; turnNumber: number } | null = null;

  turns.forEach((t) => {
    if (t.role === "interviewer") {
      lastQuestion = {
        text: t.content,
        targetDay: t.targetDay,
        depth: t.depth,
        turnNumber: t.turnNumber,
      };
    } else if (t.role === "candidate" && lastQuestion) {
      const dayFocus = focusDays.find((f) => f.day === lastQuestion?.targetDay);
      pairs.push({
        turnNumber: pairs.length + 1,
        question: lastQuestion.text,
        answer: t.content,
        rubric: t.rubric,
        targetDay: lastQuestion.targetDay,
        depth: lastQuestion.depth,
        topicTitle: dayFocus?.title ?? "AI Project Topic",
      });
      lastQuestion = null;
    }
  });

  return pairs;
}

export function Report({
  feedback,
  panel,
  turns = [],
  focusDays = [],
  candidate,
  endedEarly = false,
}: {
  feedback: Feedback;
  panel: ReportPanel | null;
  turns?: Turn[];
  focusDays?: FocusDay[];
  candidate?: Candidate;
  endedEarly?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "replay" | "action">("overview");
  const [expandedTurns, setExpandedTurns] = useState<Record<number, boolean>>({});

  const toggleExpand = (num: number) => {
    setExpandedTurns((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const qaPairs = extractQAPairs(turns, focusDays);
  const perf = calculatePerformance(turns);

  const hasStrengths = feedback.strengths.length > 0;
  const hasGaps = feedback.gaps.length > 0;
  const hasTopics = panel && panel.topics.length > 0;

  const derivedSignals = candidate ? deriveSignals(candidate) : null;
  const struggledMissions = derivedSignals?.struggledDays ?? [];
  const failedMissions = derivedSignals?.failedDays ?? [];

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <header className="space-y-4 border-b border-white/10 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-[#1FD16A]/10 text-[#1FD16A] border border-[#1FD16A]/30">
            <span className="w-2 h-2 rounded-full bg-[#1FD16A] animate-pulse" />
            Practice Completed!
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#7E8B84] font-mono">
              Learner: <strong className="text-white">{candidate?.member?.name ?? "Candidate"}</strong>
            </span>
          </div>
        </div>

        {endedEarly && (
          <p className="text-xs font-mono text-[#8B968F] border-l-2 border-[#1FD16A]/40 pl-3 py-1">
            You finished the practice session early! Here is how you did on the questions you answered.
          </p>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Your Practice Results &amp; Feedback
            </h1>
            {feedback.summary && (
              <p className="text-base text-[#C5D0C8] leading-relaxed max-w-3xl mt-2">
                {feedback.summary}
              </p>
            )}
          </div>

          {/* Overall Score Badge */}
          <div className="shrink-0 p-5 rounded-2xl bg-[#1FD16A]/10 border border-[#1FD16A]/30 shadow-[0_0_20px_rgba(31,209,106,0.15)] space-y-1 text-center min-w-[200px]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#7E8B84]">
              Overall Score
            </div>
            <div className="text-3xl font-bold text-[#1FD16A] tracking-tight font-mono">
              {perf.pct}%
            </div>
            <div className="text-xs font-semibold text-white">
              {perf.grade}
            </div>
          </div>
        </div>
      </header>

      {/* Tabbed Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "overview"
              ? "bg-[#1FD16A] text-black shadow-[0_0_15px_rgba(31,209,106,0.3)]"
              : "bg-white/5 border border-white/10 text-[#7E8B84] hover:text-white hover:border-white/20"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Overview &amp; Highlights
        </button>

        <button
          onClick={() => setActiveTab("replay")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "replay"
              ? "bg-[#1FD16A] text-black shadow-[0_0_15px_rgba(31,209,106,0.3)]"
              : "bg-white/5 border border-white/10 text-[#7E8B84] hover:text-white hover:border-white/20"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Questions &amp; Your Answers ({qaPairs.length})
        </button>

        <button
          onClick={() => setActiveTab("action")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "action"
              ? "bg-[#1FD16A] text-black shadow-[0_0_15px_rgba(31,209,106,0.3)]"
              : "bg-white/5 border border-white/10 text-[#7E8B84] hover:text-white hover:border-white/20"
          }`}
        >
          <Zap className="w-4 h-4" />
          Simple Action Plan &amp; What NOT to Do
        </button>
      </div>

      {/* Tab 1: Overview & Highlights */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Strong Points & Things to Improve */}
          {(hasStrengths || hasGaps) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strong Points */}
              {hasStrengths && (
                <div className="p-6 rounded-2xl border border-teal-500/20 bg-teal-950/20 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    </div>
                    <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">
                      What You Explained Really Well 🌟
                    </h2>
                  </div>
                  <ul className="space-y-3">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#C5D0C8]">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Things to Improve */}
              {hasGaps && (
                <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-950/20 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    </div>
                    <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">
                      Things to Explain Better Next Time 💡
                    </h2>
                  </div>
                  <ul className="space-y-3">
                    {feedback.gaps.map((g, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#C5D0C8]">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Topics Covered */}
          {hasTopics && (
            <section className="p-6 rounded-2xl border border-violet-500/20 bg-violet-950/20 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                </div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-violet-400">
                  Topics You Practiced
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {topicFindings(panel!.topics).map((t) => (
                  <div key={t.day} className="space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-semibold truncate pr-2">{t.title}</span>
                      <span className="text-[#1FD16A] font-bold">Good Understanding</span>
                    </div>
                    <p className="text-xs text-[#8B968F] leading-relaxed">{t.finding}</p>
                    <ScoreBar pct={Math.min(100, (t.day / 31) * 100)} color="#8B5CF6" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Past History vs Live Practice */}
          {panel?.comparison && (
            <section className="p-6 rounded-2xl border border-sky-500/20 bg-sky-950/20 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                  <Award className="w-4 h-4 text-sky-400" />
                </div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">
                  Your Learning Journey Progress
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#7E8B84]">What You Worked On Earlier</p>
                  <p className="text-sm text-[#C5D0C8] leading-relaxed">{panel.comparison.record}</p>
                </div>
                <div className="space-y-1 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#7E8B84]">How You Performed Today</p>
                  <p className="text-sm text-[#C5D0C8] leading-relaxed">{panel.comparison.interview}</p>
                </div>
              </div>
            </section>
          )}
        </motion.div>
      )}

      {/* Tab 2: Q&A Replay & Turn Scores */}
      {activeTab === "replay" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1FD16A]" />
              Check All Questions &amp; Your Answers
            </h2>
            <span className="text-xs font-mono text-[#7E8B84]">
              {qaPairs.length} questions total
            </span>
          </div>

          <div className="space-y-5">
            {qaPairs.map((qa) => {
              const isOpen = expandedTurns[qa.turnNumber] ?? true;
              const k = qa.rubric?.knowledge ?? 3;
              const c = qa.rubric?.communication ?? 3;
              const sScore = qa.rubric?.specificity ?? 3;

              let gradeBadge = "Good Answer 👍 (3/5)";
              let badgeStyle = "bg-amber-500/10 border-amber-500/30 text-amber-400";

              if (k >= 4) {
                gradeBadge = `Great Job! ⭐ (${k}/5)`;
                badgeStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
              } else if (k <= 2) {
                gradeBadge = `Needs More Detail 🔍 (${k}/5)`;
                badgeStyle = "bg-rose-500/10 border-rose-500/30 text-rose-400";
              }

              return (
                <div
                  key={qa.turnNumber}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-all shadow-md"
                >
                  {/* Q&A Header Bar */}
                  <button
                    onClick={() => toggleExpand(qa.turnNumber)}
                    className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#1FD16A]/10 border border-[#1FD16A]/30 flex items-center justify-center font-mono font-bold text-xs text-[#1FD16A]">
                        Q{qa.turnNumber}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                          {qa.topicTitle}
                          {qa.depth && (
                            <span className="text-[10px] font-mono text-[#7E8B84] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                              Question Difficulty {qa.depth}/5
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#7E8B84] line-clamp-1 mt-0.5">
                          {qa.question}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${badgeStyle}`}>
                        {gradeBadge}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#7E8B84]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#7E8B84]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Q&A Details */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-4">
                      {/* Interviewer Question */}
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[#1FD16A] font-semibold">
                          Interviewer Question
                        </div>
                        <p className="text-sm text-white leading-relaxed">
                          {qa.question}
                        </p>
                      </div>

                      {/* Candidate Answer */}
                      <div className="p-4 rounded-xl bg-[#1FD16A]/10 border border-[#1FD16A]/20 space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[#7E8B84] font-semibold">
                          Your Response
                        </div>
                        <p className="text-sm text-emerald-100 leading-relaxed">
                          "{qa.answer}"
                        </p>
                      </div>

                      {/* Simple Turn Assessment */}
                      {qa.rubric && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7E8B84] font-semibold">
                            Simple Score Card
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[#7E8B84]">
                                <span>Understanding</span>
                                <span className="text-white font-bold">{qa.rubric.knowledge}/5</span>
                              </div>
                              <ScoreBar pct={(qa.rubric.knowledge / 5) * 100} color="#1FD16A" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[#7E8B84]">
                                <span>Clarity</span>
                                <span className="text-white font-bold">{qa.rubric.communication}/5</span>
                              </div>
                              <ScoreBar pct={(qa.rubric.communication / 5) * 100} color="#3B82F6" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[#7E8B84]">
                                <span>Real Examples</span>
                                <span className="text-white font-bold">{qa.rubric.specificity}/5</span>
                              </div>
                              <ScoreBar pct={(qa.rubric.specificity / 5) * 100} color="#8B5CF6" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Tab 3: Action Plan & Anti-Patterns */}
      {activeTab === "action" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Section 1: What NOT to Do (Super Simple Anti-Patterns) */}
          <section className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">
                  What NOT to Do (Big Mistakes to Avoid 🛑)
                </h2>
                <p className="text-xs text-[#8B968F]">
                  Important things to avoid when building your AI projects.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-rose-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  DO NOT: Lock Secret Numbers inside Code
                </div>
                <p className="text-xs text-[#C5D0C8] leading-relaxed">
                  Don't type important settings or passwords right inside your code files. Put them in a separate setup file so you can change them easily without breaking things.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-rose-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  DO NOT: Guess or Hide Errors
                </div>
                <p className="text-xs text-[#C5D0C8] leading-relaxed">
                  If your computer program doesn't know the answer, don't let it guess silently. Always show a clear message so users know what happened.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-rose-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  DO NOT: Send Giant Piles of Text at Once
                </div>
                <p className="text-xs text-[#C5D0C8] leading-relaxed">
                  Don't overload the AI with huge amounts of text all in one go. Break your information into smaller, clean paragraphs so it stays fast.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-rose-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  DO NOT: Claim Things You Didn't Build
                </div>
                <p className="text-xs text-[#C5D0C8] leading-relaxed">
                  Only explain features that are actually built and working in your code. Don't use big fancy words if you haven't tested the code yourself!
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Cohort Learning History & Past Attempts */}
          {(struggledMissions.length > 0 || failedMissions.length > 0) && (
            <section className="p-6 rounded-2xl border border-amber-500/20 bg-amber-950/20 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <History className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                    Your Past Practice Days (What Took Extra Work 🔄)
                  </h2>
                  <p className="text-xs text-[#8B968F]">
                    These are the days in your 31-day journey where you tried multiple times to get your code working.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {struggledMissions.map((day) => (
                  <div
                    key={day}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2"
                  >
                    <span>Day {day} Project</span>
                    <span className="text-[10px] text-amber-400/70 font-sans">Tried 2+ Times</span>
                  </div>
                ))}
                {failedMissions.map((day) => (
                  <div
                    key={day}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2"
                  >
                    <span>Day {day} Project</span>
                    <span className="text-[10px] text-rose-400/70 font-sans">Needed Help</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Easy Step-by-Step Next Steps */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#1FD16A]" />
                Simple Next Steps for You
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedback.next.map((step, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#1FD16A]">
                      STEP 0{i + 1}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-[#1FD16A]" />
                  </div>
                  <p className="text-sm text-[#C5D0C8] leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
