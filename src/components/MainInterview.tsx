"use client";

import { type Entry } from "./ConversationTranscript";
import { type PanelData } from "./Panel";
import { DepthTrace, type TracePoint } from "./DepthTrace";
import { Composer } from "./Composer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";


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
}) {
  // Find the last question/closing and potentially its preceding ack
  let currentAck: string | null = null;
  let currentQuestion: string | null = null;
  let currentTopic: string = "General";
  
  // Go backwards to find the last question/closing
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.kind === "question" || e.kind === "closing") {
      currentQuestion = e.text;
      
      // Look for ack right before it
      if (i > 0 && entries[i-1].kind === "ack") {
        currentAck = entries[i-1].text;
      }
      
      // Determine topic
      if (e.traceIndex !== null && panelData?.depthHistory && panelData?.plan?.focusDays) {
        const depthInfo = panelData.depthHistory[e.traceIndex];
        if (depthInfo && depthInfo.day !== null) {
          const dayPlan = panelData.plan.focusDays.find(d => d.day === depthInfo.day);
          if (dayPlan) currentTopic = dayPlan.title;
        }
      }
      break;
    }
  }

  const s = panelData?.state;
  const questionCount = s?.questionCount ?? 0;
  const targetQuestions = panelData?.plan?.targetQuestions ?? 0;
  const points: TracePoint[] = panelData?.depthHistory ?? [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/5 shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo Mark */}
          <div className="w-6 h-6 bg-[#16A34A] rounded shadow-[0_0_12px_rgba(22,163,74,0.4)] flex items-center justify-center">
            <span className="text-white text-[11px] font-bold font-sans">M</span>
          </div>
          <span className="font-editorial font-semibold text-[14px] text-white tracking-tight">MockMate</span>
        </div>
        
        <div className="font-sans font-medium text-[11px] uppercase tracking-widest text-[#7E8B84]">
          Question {questionCount} {targetQuestions ? `/ ${targetQuestions}` : '· In Progress'}
        </div>
        
        <button 
          onClick={onExit}
          className="font-sans font-medium text-[11px] uppercase tracking-widest text-[#7E8B84] hover:text-white transition-colors cursor-pointer"
        >
          Exit interview
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-center px-8 md:px-16 py-10 relative scrollbar-hide">
        <div className="w-full max-w-[48rem] mx-auto flex flex-col justify-center flex-1">
          
          {entries.length === 0 && !thinking && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-1 items-center justify-center"
            >
              <p className="font-sans font-medium text-[11px] uppercase tracking-[0.14em] text-[#7E8B84] animate-pulse">
                Initializing interview session...
              </p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div 
                key={currentQuestion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: thinking ? 0.4 : 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="will-change-transform"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shadow-[0_0_8px_rgba(22,163,74,0.6)] animate-pulse" />
                  <span className="font-sans font-semibold text-[10px] uppercase tracking-[0.14em] text-[#CFD7D0]">
                    Interviewer
                  </span>
                  <span className="font-sans font-medium text-[9px] uppercase tracking-[0.14em] text-[#7E8B84] ml-2 px-2 py-0.5 border border-white/10 rounded-full bg-white/5">
                    {currentTopic}
                  </span>
                </div>
                
                {currentAck && (
                  <p className="font-editorial text-[24px] leading-[1.5] text-[#7E8B84] mb-4 italic">
                    {currentAck}
                  </p>
                )}
                
                <h2 className="font-editorial font-medium text-[36px] md:text-[42px] leading-[1.25] text-white tracking-tight mb-12">
                  {currentQuestion}
                </h2>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spacer if no question to push composer down */}
          {!currentQuestion && <div className="flex-1" />}

        </div>

        {/* Depth Trace Animation Component */}
        <div className="w-full max-w-[48rem] mx-auto mt-auto mb-10 opacity-70 hover:opacity-100 transition-opacity duration-300">
          <div className="font-sans font-semibold text-[10px] uppercase tracking-[0.14em] text-[#7E8B84] mb-4">
            Interview Depth
          </div>
          <DepthTrace 
            points={points} 
            thinking={thinking} 
            activeIndex={activeIndex} 
            onHoverIndex={onHoverIndex} 
          />
        </div>

        {/* Composer placed at bottom of main view */}
        <div className="w-full max-w-[48rem] mx-auto pb-6">
          <Composer
            onSubmit={onSubmit}
            disabled={thinking || done}
            status={thinking ? "Considering your answer..." : status}
          />
        </div>
      </div>
    </div>
  );
}
