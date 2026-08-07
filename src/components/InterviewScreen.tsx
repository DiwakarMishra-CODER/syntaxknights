"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Composer } from "./Composer";
import { Conversation, type Entry } from "./Conversation";
import { Panel, type PanelData } from "./Panel";

/** The deliberate beat between acknowledgement and question. */
const BEAT_MS = 600;

interface Feedback {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

/**
 * Splits "Okay. What happens when a pod restarts?" into the acknowledgement
 * and the question, so the question can land after a beat.
 *
 * The API returns `reply` as one string and the split is not stored, so
 * this is a heuristic: a short leading sentence with substance after it.
 * When it does not match, the whole reply is shown as the question, which
 * is the safe failure.
 */
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
      /* the panel is an instrument, not the interview — never block on it */
    }
  }, []);

  /** Appends the interviewer's turn: acknowledgement, beat, then question. */
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
    <main className="flex h-screen overflow-hidden">
      <div className="paper-grid flex min-w-0 flex-1 flex-col bg-paper">
        {entries.length === 0 && !thinking && (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-apparatus text-[10.5px] uppercase tracking-[0.14em] text-graphite-35">
              opening
            </p>
          </div>
        )}

        <Conversation
          entries={entries}
          thinking={thinking}
          activeIndex={activeIndex}
          onHoverIndex={setActiveIndex}
        />

        {done && feedback ? (
          <FeedbackBlock feedback={feedback} />
        ) : (
          <Composer
            onSubmit={(text) => void send({ message: text }, text)}
            disabled={thinking || done}
            status={thinking ? "measuring…" : status}
          />
        )}
      </div>

      <Panel
        data={panel}
        thinking={thinking}
        activeIndex={activeIndex}
        onHoverIndex={setActiveIndex}
      />
    </main>
  );
}

function FeedbackBlock({ feedback }: { feedback: Feedback }) {
  const groups: Array<[string, string[]]> = [
    ["Strengths", feedback.strengths],
    ["Gaps", feedback.gaps],
    ["Next", feedback.next],
  ];

  return (
    <div className="max-h-[54vh] overflow-y-auto border-t border-rule bg-paper-raised">
      <div className="mx-auto max-w-[46rem] px-10 py-8">
        <h2 className="font-apparatus text-[10.5px] uppercase tracking-[0.14em] text-graphite-35">
          After the interview
        </h2>
        <p className="mt-4 max-w-[34rem] font-question text-[19px] font-light leading-[1.6] text-graphite">
          {feedback.summary}
        </p>

        {groups.map(([label, items]) =>
          items.length === 0 ? null : (
            <section key={label} className="mt-7">
              <h3 className="font-apparatus text-[9.5px] uppercase tracking-[0.09em] text-graphite-35">
                {label}
              </h3>
              <ul className="mt-2 space-y-2">
                {items.map((t, i) => (
                  <li
                    key={i}
                    className="font-apparatus max-w-[40rem] text-[11.5px] leading-[1.7] text-graphite-60"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          )
        )}
      </div>
    </div>
  );
}
