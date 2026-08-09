"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX, Video } from "lucide-react";
import { type Entry } from "./ConversationTranscript";
import { type PanelData } from "./Panel";
import { Composer } from "./Composer";
import { playSendSound, playReceiveSound, playEndSound } from "@/lib/audio";

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

  const prevEntriesLength = useRef(entries.length);
  const prevDone = useRef(done);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }

    // Sound logic for incoming questions
    if (!muted && entries.length > prevEntriesLength.current) {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && (lastEntry.kind === "question" || lastEntry.kind === "closing")) {
        playReceiveSound();
      }
    }
    prevEntriesLength.current = entries.length;
  }, [entries, thinking, muted]);

  useEffect(() => {
    if (!muted && done && !prevDone.current) {
      playEndSound();
    }
    prevDone.current = done;
  }, [done, muted]);

  const handleSubmit = (text: string) => {
    if (!muted) playSendSound();
    onSubmit(text);
  };

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
    <div className="flex-1 flex flex-row w-full h-full bg-slate-50 dark:bg-[#050806] overflow-hidden">
      
      {/* Left Sidebar: Context & Proctoring */}
      <aside className="hidden md:flex w-72 flex-col border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#0B120E] shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              MockMate
              <span className="text-[9px] uppercase font-mono font-medium text-emerald-600 dark:text-[#1FD16A] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#1FD16A]/10 border border-emerald-200/60 dark:border-[#1FD16A]/20">
                Live Practice
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {candidateName} • {candidateRole}
            </p>
          </div>
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              title={muted ? "Unmute sounds" : "Mute sounds"}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </button>
          )}
        </div>


        {/* Session Stats */}
        <div className="p-5 flex-1 space-y-6 overflow-y-auto">
          <div>
             <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Current Topic</div>
             <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5">
               <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
               <span className="truncate">{currentTopic}</span>
             </div>
          </div>
          <div>
             <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Interview Progress</div>
             <div className="bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5">
               <div className="flex justify-between items-end mb-2">
                 <span className="text-xs font-semibold text-slate-900 dark:text-white">Question {questionCount}</span>
                 <span className="text-[10px] text-slate-500 font-mono">{targetQuestions ? `of ${targetQuestions}` : ""}</span>
               </div>
               <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                   style={{ width: targetQuestions ? `${(questionCount / targetQuestions) * 100}%` : '10%' }}
                 />
               </div>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#0B120E] shrink-0">
           <button
             onClick={onExit}
             className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200/50 dark:border-rose-500/20 transition-colors shadow-sm active:scale-[0.98]"
           >
             End Session
           </button>
        </div>
      </aside>

      {/* Main Chat Stream Container */}
      <div className="relative flex min-h-0 flex-1 flex-col z-10 bg-slate-50/50 dark:bg-[#050806]">
        {/* Top bar for mobile (hidden on desktop) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0B120E]">
          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            MockMate
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Q{questionCount}</span>
            <button onClick={onExit} className="text-[10px] uppercase font-bold text-rose-600">End</button>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-12 scroll-smooth space-y-6"
        >
          <div className="max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-6">
            {entries.length === 0 && !thinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-4 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Session Initializing</h3>
                <p className="font-sans text-xs text-slate-500">
                  Interviewer is preparing your technical assessment...
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
                      className="flex flex-col space-y-2 w-full max-w-2xl"
                    >
                      <div className="flex items-center gap-2 px-1">
                        <div className="w-6 h-6 rounded-md bg-slate-900 dark:bg-white flex items-center justify-center text-[9px] font-bold text-white dark:text-black">
                          AI
                        </div>
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          Interviewer
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          • {topicTitle}
                        </span>
                      </div>

                      <div className="p-5 sm:p-6 rounded-2xl rounded-tl-sm bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 font-sans text-[15px] leading-relaxed shadow-sm">
                        {entry.text}
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
                      className="flex flex-col items-end space-y-2 w-full max-w-2xl ml-auto"
                    >
                      <div className="flex items-center gap-2 px-1">
                        <span className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                          You
                        </span>
                        <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                          {candidateName.charAt(0)}
                        </div>
                      </div>

                      <div className="p-5 sm:p-6 rounded-2xl rounded-tr-sm bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 text-emerald-950 dark:text-emerald-50 font-sans text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap text-left w-full">
                        {entry.text}
                      </div>
                    </motion.div>
                  );
                }

                return null;
              })}
            </AnimatePresence>

            {thinking && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 w-full max-w-2xl"
              >
                <div className="w-6 h-6 rounded-md bg-slate-900 dark:bg-white flex items-center justify-center text-[9px] font-bold text-white dark:text-black">
                  AI
                </div>
                <div className="flex gap-1 items-center bg-white dark:bg-[#111726] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Composer Area */}
        <div className="shrink-0 p-4 md:p-6 lg:px-8 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#0B120E] z-20">
          <div className="max-w-4xl xl:max-w-5xl mx-auto">
            {done ? (
              <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/10 text-center space-y-2 shadow-sm">
                <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">Session Complete</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  The interview has concluded. You may now end the session to view your report.
                </p>
              </div>
            ) : (
              <Composer
                onSubmit={(text) => {
                  playSendSound();
                  onSubmit(text);
                }}
                disabled={thinking}
                status={thinking ? "Evaluating..." : status}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
