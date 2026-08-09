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
import {
  assessmentCriteria,
  calculatePerformance,
  extractQAPairs,
  rung,
} from "@/lib/report-view";
import { deriveSignals } from "@/lib/signals";
import type { Candidate, Feedback, FocusDay, Turn } from "@/lib/types";
import type { PanelData } from "./Panel";

export type ReportPanel = Pick<
  PanelData,
  "topics" | "unjustified" | "comparison" | "explanation"
>;

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full overflow-hidden bg-[var(--app-border)]">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
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
  const criteria = assessmentCriteria(turns, focusDays);

  const hasStrengths = feedback.strengths.length > 0;
  const hasGaps = feedback.gaps.length > 0;
  const hasNext = feedback.next.length > 0;
  const hasTopics = panel && panel.topics.length > 0;
  // Both of these are computed in page.tsx and were rendered nowhere. They are
  // the only two panel signals that can report a shortfall, so dropping them
  // left the report structurally unable to deliver bad news.
  const unjustified = panel?.unjustified ?? [];
  const explanation = panel?.explanation ?? null;

  const derivedSignals = candidate ? deriveSignals(candidate) : null;
  const struggledMissions = derivedSignals?.struggledDays ?? [];
  const failedMissions = derivedSignals?.failedDays ?? [];

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8 text-[var(--app-fg)]">
      {/* Header Banner */}
      <header className="space-y-4 border-b border-[var(--app-border)] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-[var(--app-accent-soft)] text-[var(--app-accent-text)] border border-[var(--app-accent-border)]">
            <span className="w-2 h-2 rounded-full bg-[var(--app-accent)] animate-pulse" />
            Practice Completed!
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--app-muted)] font-mono">
              Learner: <strong className="text-[var(--app-fg-strong)]">{candidate?.member?.name ?? "Candidate"}</strong>
            </span>
          </div>
        </div>

        {endedEarly && (
          <p className="text-xs font-mono text-[var(--app-muted)] border-l-2 border-[var(--app-accent)]/40 pl-3 py-1">
            You finished the practice session early! Here is how you did on the questions you answered.
          </p>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--app-fg-strong)] leading-tight">
              Your Practice Results &amp; Feedback
            </h1>
            {feedback.summary && (
              <p className="text-base text-[var(--app-body)] leading-relaxed max-w-3xl mt-2">
                {feedback.summary}
              </p>
            )}
          </div>

          {/* Overall Score Badge — hidden when nothing was answered, rather
              than showing a grade that nothing supports. */}
          {perf && (
          <div className="shrink-0 p-5 rounded-2xl bg-[var(--app-accent-soft)] border border-[var(--app-accent-border)] shadow-[0_0_20px_rgba(31,209,106,0.15)] space-y-1 text-center min-w-[200px]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--app-muted)]">
              Overall Score
            </div>
            <div className="text-3xl font-bold text-[var(--app-accent-text)] tracking-tight font-mono">
              {perf.pct}%
            </div>
            <div className="text-xs font-semibold text-[var(--app-fg-strong)]">
              {perf.grade}
            </div>
          </div>
          )}
        </div>
      </header>

      {/* Tabbed Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--app-border)] pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "overview"
              ? "bg-[var(--app-accent)] text-[#050806] shadow-[0_0_15px_rgba(31,209,106,0.3)]"
              : "bg-[var(--app-glass)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-fg-strong)] hover:border-[var(--app-border-soft)]"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Overview &amp; Highlights
        </button>

        <button
          onClick={() => setActiveTab("replay")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "replay"
              ? "bg-[var(--app-accent)] text-[#050806] shadow-[0_0_15px_rgba(31,209,106,0.3)]"
              : "bg-[var(--app-glass)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-fg-strong)] hover:border-[var(--app-border-soft)]"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Questions &amp; Your Answers ({qaPairs.length})
        </button>

        <button
          onClick={() => setActiveTab("action")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "action"
              ? "bg-[var(--app-accent)] text-[#050806] shadow-[0_0_15px_rgba(31,209,106,0.3)]"
              : "bg-[var(--app-glass)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-fg-strong)] hover:border-[var(--app-border-soft)]"
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
          {/* Assessment matrix. Every bar below is a number the interview
              actually measured -- see assessmentCriteria(). */}
          {criteria && (
          <section className="p-6 rounded-2xl border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-accent-border)] flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-[var(--app-accent-text)]" />
                </div>
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--app-accent-text)]">
                    Assessment Matrix
                  </h2>
                  <p className="text-xs text-[var(--app-muted)]">
                    Averaged across the {criteria.scoredCount} of your {qaPairs.length} answers that were scored.
                  </p>
                </div>
              </div>
              {perf && (
                <span className="text-xs font-mono font-bold text-[var(--app-accent-text)] px-3 py-1 rounded-full bg-[var(--app-accent-soft)] border border-[var(--app-accent-border)]">
                  Score: {perf.pct}%
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[var(--app-glass-2)] border border-[var(--app-border)] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[var(--app-fg-strong)]">Technical Authority</span>
                  <span className="font-mono font-bold text-[var(--app-accent-text)]">
                    {rung(criteria.knowledge)}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--app-muted)]">Depth of domain concepts, accuracy of AI mechanisms.</p>
                <ScoreBar pct={criteria.knowledgePct} color="#1FD16A" />
              </div>

              <div className="p-4 rounded-xl bg-[var(--app-glass-2)] border border-[var(--app-border)] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[var(--app-fg-strong)]">Build Evidence</span>
                  <span className="font-mono font-bold text-sky-500 dark:text-sky-400">
                    {rung(criteria.specificity)}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--app-muted)]">Concrete code references and architecture examples.</p>
                <ScoreBar pct={criteria.specificityPct} color="#38BDF8" />
              </div>

              <div className="p-4 rounded-xl bg-[var(--app-glass-2)] border border-[var(--app-border)] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[var(--app-fg-strong)]">Clear Explanation</span>
                  <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                    {rung(criteria.communication)}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--app-muted)]">How readably you walked someone through your own build.</p>
                <ScoreBar pct={criteria.communicationPct} color="#A78BFA" />
              </div>

              {criteria.objectivesPlanned > 0 && (
                <div className="p-4 rounded-xl bg-[var(--app-glass-2)] border border-[var(--app-border)] space-y-2 sm:col-span-2 lg:col-span-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[var(--app-fg-strong)]">Curriculum Objectives Covered</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {criteria.objectivesHit} of {criteria.objectivesPlanned}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--app-muted)]">
                    Objectives from the days you were asked about that you spoke to directly.
                  </p>
                  <ScoreBar pct={criteria.objectivesPct} color="#FBBF24" />
                </div>
              )}
            </div>

            {panel?.comparison?.note && (
              <p className="text-[11px] text-[var(--app-muted)] border-l-2 border-[var(--app-accent-border)] pl-3">
                {panel.comparison.note}
              </p>
            )}
          </section>
          )}
          {/* Strong Points & Things to Improve */}
          {(hasStrengths || hasGaps) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strong Points */}
              {hasStrengths && (
                <div className="p-6 rounded-2xl border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/20 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                      What You Explained Really Well 🌟
                    </h2>
                  </div>
                  <ul className="space-y-3">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-teal-900 dark:text-teal-100">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Things to Improve */}
              {hasGaps && (
                <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                      Things to Explain Better Next Time 💡
                    </h2>
                  </div>
                  <ul className="space-y-3">
                    {feedback.gaps.map((g, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-rose-900 dark:text-rose-100">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Knowing it vs being able to say it — explanationSignal(rubrics).
              Null when the two track each other, i.e. there is no finding. */}
          {explanation && (
            <section className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Knowing It vs Explaining It
                </h2>
              </div>
              <p className="text-sm text-indigo-900 dark:text-[#C5D0C8] leading-relaxed">
                {explanation}
              </p>
            </section>
          )}

          {/* Topics Covered */}
          {hasTopics && (
            <section className="p-6 rounded-2xl border border-violet-500/20 bg-violet-50/50 dark:bg-violet-950/20 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                  Topics You Practiced
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {topicFindings(panel!.topics).map((t) => (
                  <div key={t.day} className="space-y-2 p-4 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-violet-200/50 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-violet-900 dark:text-white font-semibold truncate pr-2">{t.title}</span>
                      {/* Was the hardcoded string "Good Understanding", printed
                          next to every topic whatever the candidate said. */}
                      <span
                        className={`font-bold shrink-0 ${
                          t.knowledgeAvg === null
                            ? "text-violet-400 dark:text-[#7E8B84]"
                            : t.knowledgeAvg >= 4
                              ? "text-[var(--app-accent-text)]"
                              : t.knowledgeAvg >= 3
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {t.level ?? "Not scored"}
                        {t.knowledgeAvg !== null && ` (${rung(t.knowledgeAvg)})`}
                      </span>
                    </div>
                    <p className="text-xs text-violet-700 dark:text-[#8B968F] leading-relaxed">{t.finding}</p>
                    {/* Was (t.day / 31) * 100 — the curriculum day number drawn
                        as a progress bar. A day-28 topic showed 90%. */}
                    {t.knowledgeAvg !== null && (
                      <ScoreBar pct={(t.knowledgeAvg / 5) * 100} color="#8B5CF6" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Past History vs Live Practice */}
          {panel?.comparison && (
            <section className="p-6 rounded-2xl border border-sky-500/20 bg-sky-50/50 dark:bg-sky-950/20 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                  <Award className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                  Your Learning Journey Progress
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 p-4 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-sky-200/50 dark:border-white/5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-sky-600 dark:text-[#7E8B84]">What You Worked On Earlier</p>
                  <p className="text-sm text-sky-900 dark:text-[#C5D0C8] leading-relaxed">{panel.comparison.record}</p>
                </div>
                <div className="space-y-1 p-4 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-sky-200/50 dark:border-white/5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-sky-600 dark:text-[#7E8B84]">How You Performed Today</p>
                  <p className="text-sm text-sky-900 dark:text-[#C5D0C8] leading-relaxed">{panel.comparison.interview}</p>
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
            <h2 className="text-lg font-bold text-[var(--app-fg-strong)] tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--app-accent-text)]" />
              Check All Questions &amp; Your Answers
            </h2>
            <span className="text-xs font-mono text-[var(--app-muted)]">
              {qaPairs.length} questions total
            </span>
          </div>

          <div className="space-y-5">
            {qaPairs.map((qa) => {
              const isOpen = expandedTurns[qa.turnNumber] ?? true;
              // An answer the model never scored gets no badge and no bars.
              // Defaulting these to 3 printed "Good Answer (3/5)" under every
              // answer in the report, including ones nothing had graded.
              const k = qa.rubric?.knowledge ?? null;
              const c = qa.rubric?.communication ?? null;
              const sScore = qa.rubric?.specificity ?? null;
              const scored = k !== null && c !== null && sScore !== null;

              // The middle band is 3/5 — "correct, and stops there". Calling
              // that a "Good Answer" told candidates their thinnest answers
              // had landed, which is the same verdict leak the reaction guard
              // exists to stop, printed one screen later.
              let gradeBadge = `Partly There 🛠️ (${k}/5)`;
              let badgeStyle = "bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400";

              if (k !== null && k >= 4) {
                gradeBadge = `Great Job! ⭐ (${k}/5)`;
                badgeStyle = "bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
              } else if (k !== null && k <= 2) {
                gradeBadge = `Needs More Detail 🔍 (${k}/5)`;
                badgeStyle = "bg-rose-100 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400";
              }

              return (
                <div
                  key={qa.turnNumber}
                  className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-glass)] overflow-hidden transition-all shadow-md"
                >
                  {/* Q&A Header Bar */}
                  <button
                    onClick={() => toggleExpand(qa.turnNumber)}
                    className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-[var(--app-glass-2)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[var(--app-accent-soft)] border border-[var(--app-accent-border)] flex items-center justify-center font-mono font-bold text-xs text-[var(--app-accent-text)]">
                        Q{qa.turnNumber}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--app-fg-strong)] tracking-tight flex items-center gap-2">
                          {qa.topicTitle}
                          {qa.depth && (
                            <span className="text-[10px] font-mono text-[var(--app-muted)] px-2 py-0.5 rounded-full bg-[var(--app-glass-2)] border border-[var(--app-border)]">
                              Question Difficulty {qa.depth}/5
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--app-muted)] line-clamp-1 mt-0.5">
                          {qa.question}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {scored && (
                        <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${badgeStyle}`}>
                          {gradeBadge}
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[var(--app-muted)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--app-muted)]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Q&A Details */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 border-t border-[var(--app-border)] space-y-4">
                      {/* Interviewer Question */}
                      <div className="p-4 rounded-xl bg-[var(--app-glass-2)] border border-[var(--app-border)] space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--app-accent-text)] font-semibold">
                          Interviewer Question
                        </div>
                        <p className="text-sm text-[var(--app-fg-strong)] leading-relaxed">
                          {qa.question}
                        </p>
                      </div>

                      {/* Candidate Answer */}
                      <div className="p-4 rounded-xl bg-[var(--app-accent-soft)] border border-[var(--app-accent-border)] space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--app-muted)] font-semibold">
                          Your Response
                        </div>
                        <p className="text-sm text-[var(--app-answer-text)] leading-relaxed">
                          "{qa.answer}"
                        </p>
                      </div>

                      {/* Why this question was asked.

                          Generated on every turn and stored, but only ever visible on screen

                          DURING the interview -- where it told the candidate exactly what was

                          being probed. Here the interview is over. */}

                      {qa.rationale && (

                        <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 space-y-1">

                          <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-semibold">

                            Why you were asked this

                          </div>

                          <p className="text-sm text-[#CFD7D0] leading-relaxed">{qa.rationale}</p>

                        </div>

                      )}


                      {/* Simple Turn Assessment */}
                      {qa.rubric && (
                        <div className="p-4 rounded-xl bg-[var(--app-glass)] border border-[var(--app-border)] space-y-3">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--app-muted)] font-semibold">
                            Simple Score Card
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[var(--app-muted)]">
                                <span>Understanding</span>
                                <span className="text-[var(--app-fg-strong)] font-bold">{qa.rubric.knowledge}/5</span>
                              </div>
                              <ScoreBar pct={(qa.rubric.knowledge / 5) * 100} color="#1FD16A" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[var(--app-muted)]">
                                <span>Clarity</span>
                                <span className="text-[var(--app-fg-strong)] font-bold">{qa.rubric.communication}/5</span>
                              </div>
                              <ScoreBar pct={(qa.rubric.communication / 5) * 100} color="#3B82F6" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[var(--app-muted)]">
                                <span>Real Examples</span>
                                <span className="text-[var(--app-fg-strong)] font-bold">{qa.rubric.specificity}/5</span>
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
          {/* Section 1: things THIS candidate asserted without backing.
              This was four hardcoded "DO NOT" cards shown to everyone,
              including a session with zero turns — the same defect the Next
              Steps section below already had removed. The sharpest part was
              that one of the four read "DO NOT: Claim Things You Didn't
              Build" while `unjustified`, the real per-candidate, verbatim-
              validated list of exactly that, was computed and thrown away. */}
          {unjustified.length > 0 && (
            <section className="p-6 rounded-2xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                    Said, But Not Backed Up 🛑
                  </h2>
                  <p className="text-xs text-rose-800 dark:text-[#8B968F]">
                    You asserted {unjustified.length === 1 ? "this" : "these"} without
                    detail an interviewer could check. Be ready to show the code.
                  </p>
                </div>
              </div>

              <ul className="space-y-3">
                {unjustified.map((c, i) => (
                  <li
                    key={i}
                    className="p-4 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-rose-200/50 dark:border-rose-500/20 flex gap-3"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span className="text-xs text-rose-900 dark:text-[#C5D0C8] leading-relaxed">
                      {c.text}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Section 2: Cohort Learning History & Past Attempts */}
          {(struggledMissions.length > 0 || failedMissions.length > 0) && (
            <section className="p-6 rounded-2xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Your Past Practice Days (What Took Extra Work 🔄)
                  </h2>
                  <p className="text-xs text-amber-800 dark:text-[#8B968F]">
                    These are the days in your 31-day journey where you tried multiple times to get your code working.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {struggledMissions.map((day) => (
                  <div
                    key={day}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono flex items-center gap-2"
                  >
                    <span>Day {day} Project</span>
                    <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-sans">Tried 2+ Times</span>
                  </div>
                ))}
                {failedMissions.map((day) => (
                  <div
                    key={day}
                    className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-2"
                  >
                    <span>Day {day} Project</span>
                    <span className="text-[10px] text-rose-600/70 dark:text-rose-400/70 font-sans">Needed Help</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Next steps, in the order to do them.
              This was three cards of fixed text -- every candidate was told to
              extract environment variables and run RAGAS, whatever they had
              actually said. It reads feedback.next now, which is already tied
              to the days this candidate should revisit.

              The old "1 Week / 1 Month / 3 Months" labels are gone with it:
              nothing here measures how long any of these takes, and a made-up
              schedule is the same defect as a made-up score. Order is real --
              it comes from the reporter -- so that is all this claims. */}
          {hasNext && (
          <section className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Suggested Order to Work Through This
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Your next steps, sequenced. Nearest first.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              {feedback.next.map((item, i) => {
                const tone = [
                  { tint: "text-[var(--app-accent-text)]", edge: "border-emerald-500/20" },
                  { tint: "text-sky-600 dark:text-sky-400", edge: "border-sky-500/20" },
                  { tint: "text-violet-600 dark:text-violet-400", edge: "border-violet-500/20" },
                ][i % 3];
                return (
                  <div key={i} className={`p-4 rounded-xl bg-[var(--app-glass-2)] border ${tone.edge} space-y-2`}>
                    <div className="flex items-center gap-2 text-xs">
                      <Sparkles className={`w-3.5 h-3.5 ${tone.tint}`} />
                      <span className={`${tone.tint} font-bold`}>STEP {String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="text-[11px] text-[var(--app-body)] font-sans leading-relaxed">{item}</p>
                  </div>
                );
              })}
            </div>
          </section>
          )}

        </motion.div>
      )}
    </div>
  );
}
