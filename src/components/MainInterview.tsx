"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { type Entry } from "./ConversationTranscript";
import { type PanelData } from "./Panel";
import { Composer } from "./Composer";

export function MainInterview({
  entries,
  thinking,
  panelData,
  onSubmit,
  done,
  status,
  activeIndex,
  onHoverIndex,
  onExit,
  muted = false,
  onToggleMute,
}: {
  entries: Entry[];
  thinking: boolean;
  panelData: PanelData | null;
  onSubmit: (text: string) => void;
  done: boolean;
  status: string | null;
  activeIndex: number | null;
  onHoverIndex?: (i: number | null) => void;
  onExit?: () => void;
  muted?: boolean;
  onToggleMute?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [entries.length, thinking]);

  const s = panelData?.state;
  const questionCount = s?.questionCount ?? 0;
  const targetQuestions = panelData?.plan?.targetQuestions ?? 0;
  const candidateName = panelData?.candidate?.name ?? "Candidate";
  const candidateRole = panelData?.candidate?.jobRole ?? "AI Engineer";

  let currentTopic = "General";
  if (panelData?.plan?.focusDays && s?.currentDay) {
    const focus = panelData.plan.focusDays.find((d) => d.day === s.currentDay);
    if (focus) currentTopic = focus.title;
  }

  let currentQuestionNum = 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full h-full bg-transparent relative overflow-hidden">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#050806]/85 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#1FD16A]/30 bg-[#1FD16A]/10 font-bold text-xs text-[#1FD16A] shadow-[0_0_12px_rgba(31,209,106,0.15)]">
            M
          </div>
          <div>
            <div className="font-semibold text-xs text-white tracking-tight flex items-center gap-2">
              MockMate
              <span className="text-[9px] uppercase font-mono font-medium text-[#1FD16A] px-2 py-0.5 rounded-full bg-[#1FD16A]/10 border border-[#1FD16A]/20">
                Live Practice
              </span>
            </div>
            <p className="text-[11px] text-[#7E8B84] truncate">
              {candidateName} • {candidateRole}
            </p>
          </div>
        </div>

        {/* Center Topic & Progress */}
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[#7E8B84] bg-white/5 border border-white/10">
            <Sparkles className="w-3 h-3 text-[#1FD16A]" />
            {currentTopic}
          </span>
          <div className="font-mono text-[11px] font-semibold text-[#1FD16A] bg-[#1FD16A]/10 border border-[#1FD16A]/30 px-3 py-0.5 rounded-full shadow-inner">
            Q{questionCount} {targetQuestions ? `/ ${targetQuestions}` : ""}
          </div>
        </div>

        {/* Mute & End Controls */}
        <div className="flex items-center gap-2">
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              title={muted ? "Unmute sounds" : "Mute sounds"}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-[#7E8B84] hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#1FD16A]" />
              )}
            </button>
          )}

          <button
            onClick={onExit}
            className="font-sans text-[11px] font-medium uppercase tracking-wider text-[#7E8B84] hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            End Session
          </button>
        </div>
      </header>

      {/* Main Chat Stream Container */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8 lg:px-12 scroll-smooth space-y-4"
        >
          <div className="max-w-3xl lg:max-w-4xl mx-auto space-y-4">
            {entries.length === 0 && !thinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1FD16A]/10 border border-[#1FD16A]/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(31,209,106,0.15)]">
                  <span className="w-2 h-2 rounded-full bg-[#1FD16A] animate-ping" />
                </div>
                <p className="font-sans text-xs font-medium text-[#7E8B84]">
                  Interviewer is preparing your technical session...
                </p>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {entries.map((entry) => {
                const depthInfo =
                  entry.traceIndex !== null && panelData?.depthHistory
                    ? panelData.depthHistory[entry.traceIndex]
                    : null;

                if (entry.kind === "question" || entry.kind === "closing") {
                  currentQuestionNum++;
                  const topicTitle =
                    depthInfo &&
                    depthInfo.day !== null &&
                    panelData?.plan?.focusDays
                      ? panelData.plan.focusDays.find(
                          (d) => d.day === depthInfo.day
                        )?.title || `Topic`
                      : currentTopic;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-start gap-3"
                    >
                      {/* Interviewer Avatar */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#1FD16A]/30 bg-[#1FD16A]/10 font-bold text-[11px] text-[#1FD16A] shadow-[0_0_10px_rgba(31,209,106,0.15)] mt-0.5">
                        AI
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[11px] text-white">
                            Interviewer
                          </span>
                          <span className="font-mono text-[9px] text-[#1FD16A] px-2 py-0.5 rounded-full bg-[#1FD16A]/10 border border-[#1FD16A]/20">
                            Q{currentQuestionNum} • {topicTitle}
                          </span>
                        </div>

                        {/* Compact Interviewer Card */}
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-[#F5F7F4] font-sans text-[14px] leading-relaxed shadow-sm tracking-tight">
                          {entry.text}
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (entry.kind === "answer") {
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-start justify-end gap-3"
                    >
                      <div className="flex flex-col items-end space-y-1.5 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[11px] text-[#7E8B84]">
                            You
                          </span>
                        </div>

                        {/* Compact Candidate Response Bubble */}
                        <div className="p-4 rounded-xl bg-[#1FD16A]/10 border border-[#1FD16A]/25 text-[#E2E8F0] font-sans text-[14px] leading-relaxed shadow-sm">
                          {entry.text}
                        </div>
                      </div>

                      {/* Candidate Avatar */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 font-semibold text-[11px] text-white shadow-sm mt-0.5">
                        You
                      </div>
                    </motion.div>
                  );
                }

                return null;
              })}
            </AnimatePresence>

            {thinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 max-w-sm"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1FD16A]/10 border border-[#1FD16A]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1FD16A] animate-ping" />
                </div>
                <span className="font-sans text-[11px] font-medium text-[#7E8B84]">
                  Interviewer is analyzing your response...
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Compact Bottom Input Bar */}
        <div className="shrink-0 px-4 pb-4 md:px-8 border-t border-white/10 bg-[#050806]/95 backdrop-blur-xl pt-3 z-20">
          <div className="max-w-3xl lg:max-w-4xl mx-auto">
            <Composer
              onSubmit={onSubmit}
              disabled={thinking || done}
              status={thinking ? "Evaluating response..." : status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
