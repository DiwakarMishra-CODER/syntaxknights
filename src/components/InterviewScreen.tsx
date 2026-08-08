"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Entry } from "./ConversationTranscript";
import { type PanelData } from "./Panel";
import { JourneyPanel } from "./JourneyPanel";
import { SignalPanel } from "./SignalPanel";
import { MainInterview } from "./MainInterview";

const BEAT_MS = 600;

interface Feedback {
  score?: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

function splitReply(reply: string): { ack: string | null; question: string } {
  const m = reply.match(/^([^.?!]{1,28}[.!])\s+([\s\S]+)$/);
  if (!m) return { ack: null, question: reply };
  const words = m[1].trim().split(/\s+/).length;
  if (words > 5 || m[2].trim().length === 0) return { ack: null, question: reply };
  return { ack: m[1].trim(), question: m[2].trim() };
}

let uid = 0;
const nextId = () => `e${uid++}`;

export function InterviewScreen({ candidateId }: { candidateId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [thinking, setThinking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [done, setDone] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sessionId = useRef(`ui-${Date.now()}`);
  const started = useRef(false);
  const traceCount = useRef(0);

  const refreshPanel = useCallback(async () => {
    try {
      const res = await fetch(`/api/session/${sessionId.current}/state`, {
        cache: "no-store",
      });
      if (res.ok) setPanel((await res.json()) as PanelData);
    } catch {
      // Instrument fail soft
    }
  }, []);

  const speak = useCallback((reply: string, closing: boolean) => {
    const { ack, question } = splitReply(reply);
    const traceIndex = traceCount.current++;

    if (ack) {
      setEntries((prev) => [...prev, { id: nextId(), kind: "ack", text: ack, traceIndex }]);
      window.setTimeout(() => {
        setEntries((prev) => [
          ...prev,
          { id: nextId(), kind: closing ? "closing" : "question", text: question, traceIndex },
        ]);
      }, BEAT_MS);
    } else {
      setEntries((prev) => [
        ...prev,
        { id: nextId(), kind: closing ? "closing" : "question", text: question, traceIndex },
      ]);
    }
  }, []);

  const send = useCallback(
    async (body: Record<string, unknown>, showAnswer?: string) => {
      if (showAnswer) {
        setEntries((prev) => [
          ...prev,
          { id: nextId(), kind: "answer", text: showAnswer, traceIndex: null },
        ]);
      }

      setThinking(true);
      setStatus(null);

      try {
        const res = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionId.current, ...body }),
        });
        const data = (await res.json()) as {
          reply: string;
          done: boolean;
          feedback?: Feedback;
        };

        setThinking(false);
        speak(data.reply, data.done);

        if (data.done) {
          setDone(true);
          setFeedback(data.feedback ?? null);
        }
        void refreshPanel();
      } catch {
        setThinking(false);
        setStatus("Connection lost. Send again to continue.");
      }
    },
    [refreshPanel, speak]
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void send({ candidate: candidateId });
  }, [candidateId, send]);

  const handleEarlyExit = () => {
    setFeedback({
      score: undefined, // No mock data
      summary: "", // No mock data
      strengths: [],
      gaps: [],
      next: []
    });
    setDone(true);
  };

  if (feedback) {
    return (
      <div className="min-h-screen bg-[#050806] text-[#F5F7F4] relative">
        <FeedbackBlock feedback={feedback} />
      </div>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[#050806] text-[#F5F7F4] p-4 gap-4 relative">
      {/* Subtle background ambient gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1FD16A] opacity-[0.03] blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#1FD16A] opacity-[0.03] blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* 3-Column Floating Layout */}
      <JourneyPanel data={panel} />
          <MainInterview 
            entries={entries}
            thinking={thinking}
            panelData={panel}
            onSubmit={(text) => void send({ message: text }, text)}
            done={done}
            status={status}
            activeIndex={activeIndex}
            onHoverIndex={setActiveIndex}
            onExit={handleEarlyExit}
          />
      <SignalPanel 
        data={panel}
        entries={entries}
        thinking={thinking}
        activeIndex={activeIndex}
        onHoverIndex={setActiveIndex}
      />
    </main>
  );
}

function FeedbackBlock({ feedback }: { feedback: Feedback }) {
  const groups: Array<[string, string[]]> = [
    ["Next practice", feedback.next],
  ];

  return (
    <div className="w-full min-h-screen flex flex-col items-center relative z-10 overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#16A34A]/10 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1FD16A] opacity-[0.04] blur-[120px] rounded-full mix-blend-screen pointer-events-none z-0" />
      
      <div className="w-full max-w-[64rem] px-8 py-24 relative z-10 flex flex-col items-center">
        <header className="mb-16 text-center">
          <h1 className="font-editorial font-semibold text-[48px] md:text-[56px] text-white tracking-tight mb-4 drop-shadow-lg">Interview Complete</h1>
          <p className="font-sans text-[16px] uppercase tracking-[0.2em] text-[#16A34A] font-medium">Evaluation Results</p>
        </header>

        {/* Score Ring */}
        <div className="flex flex-col items-center justify-center mb-20 relative group">
          <div className="absolute inset-0 bg-[#16A34A] opacity-20 blur-[50px] rounded-full group-hover:opacity-30 transition-opacity duration-700" />
          <div className="w-40 h-40 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-xl shadow-2xl relative z-10">
            <div className="w-[140px] h-[140px] rounded-full border-[3px] border-[#16A34A]/30 border-t-[#16A34A] flex items-center justify-center relative shadow-[inset_0_0_20px_rgba(22,163,74,0.1)]">
              <span className="font-editorial text-[56px] font-medium text-white tracking-tighter">
                {feedback.score !== undefined ? feedback.score : "--"}
              </span>
            </div>
          </div>
          <span className="font-sans font-semibold text-[11px] uppercase tracking-[0.14em] text-[#7E8B84] mt-8">Overall Score</span>
        </div>

        {/* Summary Skeleton */}
        <div className="w-full max-w-[48rem] mb-20">
          {feedback.summary ? (
            <p className="font-editorial text-[24px] leading-[1.6] text-[#F5F7F4] text-center">{feedback.summary}</p>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-3/4 bg-white/5 rounded-full animate-pulse" />
              <div className="h-6 w-5/6 bg-white/5 rounded-full animate-pulse" />
              <div className="h-6 w-1/2 bg-white/5 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Strongest Areas */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h3 className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#16A34A] mb-8 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] shadow-[0_0_8px_rgba(22,163,74,0.6)]" />
              Strongest Areas
            </h3>
            <div className="space-y-4">
              {feedback.strengths.length > 0 ? (
                feedback.strengths.map((s, i) => (
                  <div key={i} className="p-5 border border-white/5 rounded-2xl bg-white/[0.02]">
                    <p className="font-sans text-[15px] leading-relaxed text-[#CFD7D0]">{s}</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
                  <div className="h-16 w-full bg-white/5 rounded-2xl animate-pulse delay-75" />
                </>
              )}
            </div>
          </div>

          {/* Areas to Improve */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h3 className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#EAB308] mb-8 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#EAB308] shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
              Areas to Improve
            </h3>
            <div className="space-y-4">
              {feedback.gaps.length > 0 ? (
                feedback.gaps.map((s, i) => (
                  <div key={i} className="p-5 border border-white/5 rounded-2xl bg-white/[0.02]">
                    <p className="font-sans text-[15px] leading-relaxed text-[#CFD7D0]">{s}</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
                  <div className="h-16 w-full bg-white/5 rounded-2xl animate-pulse delay-75" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Next Practice (Optional) */}
        {feedback.next.length > 0 && (
          <section className="w-full text-center mb-20">
            <h3 className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#7E8B84] mb-8">
              Next Practice
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {feedback.next.map((t, i) => (
                <div key={i} className="flex flex-col items-center p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md">
                  <span className="font-editorial text-[#16A34A] text-[24px] mb-4 font-semibold">0{i + 1}</span>
                  <p className="font-sans text-[15px] leading-relaxed text-[#CFD7D0]">
                    {t}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <div className="w-full flex justify-center pb-16">
          <a href="/dashboard" className="flex items-center justify-center px-10 py-5 bg-white text-black hover:bg-[#CFD7D0] font-sans font-bold text-[13px] uppercase tracking-[0.15em] rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 cursor-pointer">
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
