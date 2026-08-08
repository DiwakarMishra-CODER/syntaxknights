"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Entry } from "./ConversationTranscript";
import { type PanelData } from "./Panel";
import { JourneyPanel } from "./JourneyPanel";
import { SignalPanel } from "./SignalPanel";
import { MainInterview } from "./MainInterview";

const BEAT_MS = 600;

interface Feedback {
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

  return (
    <main className="flex h-screen overflow-hidden bg-paper text-graphite">
      {/* 3-Column Layout */}
      {!feedback ? (
        <>
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
          />
          <SignalPanel 
            data={panel}
            entries={entries}
            thinking={thinking}
            activeIndex={activeIndex}
            onHoverIndex={setActiveIndex}
          />
        </>
      ) : (
        <FeedbackBlock feedback={feedback} />
      )}
    </main>
  );
}

function FeedbackBlock({ feedback }: { feedback: Feedback }) {
  const groups: Array<[string, string[]]> = [
    ["Next practice", feedback.next],
  ];

  return (
    <div className="w-full flex-1 overflow-y-auto bg-paper px-8 py-16 flex flex-col items-center">
      <div className="w-full max-w-[64rem]">
        <header className="mb-16 text-center">
          <h1 className="font-editorial text-[42px] text-graphite mb-4">Interview complete</h1>
          <p className="font-sans text-[18px] text-graphite-60">Here&apos;s what your interview revealed.</p>
        </header>

        <div className="mb-12">
          <p className="font-editorial text-[24px] font-light leading-[1.6] text-graphite max-w-[48rem] mx-auto text-center">
            {feedback.summary}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <h3 className="font-apparatus text-[12px] uppercase tracking-widest text-graphite-60 mb-6">Strongest areas</h3>
            <div className="space-y-4">
              {feedback.strengths.map((s, i) => (
                <div key={i} className="p-6 border border-rule rounded bg-paper-raised">
                  <p className="font-sans text-[15px] leading-relaxed text-graphite">{s}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-apparatus text-[12px] uppercase tracking-widest text-graphite-60 mb-6">Areas to strengthen</h3>
            <div className="space-y-4">
              {feedback.gaps.map((s, i) => (
                <div key={i} className="p-6 border border-rule rounded bg-paper-raised">
                  <p className="font-sans text-[15px] leading-relaxed text-graphite">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {groups.map(([label, items]) =>
          items.length === 0 ? null : (
            <section key={label} className="mt-7 text-center">
              <h3 className="font-apparatus text-[12px] uppercase tracking-widest text-graphite-60 mb-8">
                {label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {items.map((t, i) => (
                  <div key={i} className="flex flex-col items-center p-8 border border-rule rounded bg-paper-raised">
                    <span className="font-apparatus text-accent-emerald text-[24px] mb-4">0{i + 1}</span>
                    <p className="font-sans text-[15px] leading-relaxed text-graphite">
                      {t}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )
        )}
      </div>
    </div>
  );
}
