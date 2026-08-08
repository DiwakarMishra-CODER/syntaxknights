"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Composer } from "./Composer";
import { Conversation, type Entry } from "./Conversation";
import { Panel, type PanelData } from "./Panel";

/** The deliberate beat between acknowledgement and question. */
const BEAT_MS = 600;

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

export function InterviewScreen({
  sessionId,
  candidateId,
  candidateName,
}: {
  sessionId: string;
  candidateId: string;
  candidateName: string;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [thinking, setThinking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [ending, setEnding] = useState(false);
  // Nothing is spent until this is cleared — see the mount effect.
  const [awaitingStart, setAwaitingStart] = useState(false);
  const router = useRouter();

  const started = useRef(false);
  const traceCount = useRef(0);

  const refreshPanel = useCallback(async () => {
    try {
      const res = await fetch(`/api/session/${sessionId}/state`, {
        cache: "no-store",
      });
      if (res.ok) setPanel((await res.json()) as PanelData);
    } catch {
      /* the panel is an instrument, not the interview — never block on it */
    }
  }, [sessionId]);

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
          body: JSON.stringify({ sessionId: sessionId, ...body }),
        });
        const data = (await res.json()) as {
          reply: string;
          done: boolean;
        };

        setThinking(false);
        speak(data.reply, data.done);

        if (data.done) {
          setDone(true);
        }
        void refreshPanel();
      } catch {
        setThinking(false);
        setStatus("Connection lost. Send again to continue.");
      }
    },
    [refreshPanel, speak]
  );

  /** Ends the session deliberately. The floors are untouched — this never
   *  routes through the model's conclude path. */
  const endInterview = useCallback(async () => {
    if (ending || thinking || done) return;
    setEnding(true);
    try {
      await fetch(`/api/session/${sessionId}/end`, { method: "POST" });
    } catch {
      /* the session may still have closed server-side; the report page copes */
    }
    router.push(`/report/${sessionId}`);
  }, [ending, thinking, done, sessionId, router]);

  // The id lives in the URL now, so a refresh is reachable for the first time.
  // Resume from what Postgres already has rather than replaying the opening
  // line over an interview that is eight turns in.
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}/state`, { cache: "no-store" });
        if (res.ok) {
          const existing = (await res.json()) as PanelData & {
            status: string;
            transcript?: Array<{ role: string; content: string }>;
          };

          if (existing.status === "done") {
            router.replace(`/report/${sessionId}`);
            return;
          }

          if (existing.transcript?.length) {
            // traceIndex is counted the same way the panel builds
            // depthHistory — one point per interviewer turn, in order — so a
            // restored question still cross-highlights its point on the trace.
            let restored = 0;
            setEntries(
              existing.transcript.map((t) => {
                const isCandidate = t.role === "candidate";
                return {
                  id: nextId(),
                  kind: isCandidate ? ("answer" as const) : ("question" as const),
                  text: t.content,
                  traceIndex: isCandidate ? null : restored++,
                };
              })
            );
            traceCount.current = restored;
            setPanel(existing);
            return;
          }
        }
      } catch {
        /* fall through and start fresh */
      }
      // Do NOT start here. Loading this page used to fire the planner
      // immediately, and the planner is on the model capped at 20 requests
      // per DAY per key — so opening the page and walking away cost a real
      // call. Four of seven sessions in one afternoon were opened and never
      // answered. It now waits for a deliberate click.
      setAwaitingStart(true);
    })();
  }, [candidateId, send, sessionId, router]);

  return (
    <main className="interview-root flex h-screen overflow-hidden">
      <div className="paper-grid flex min-h-0 min-w-0 flex-1 flex-col bg-paper">
        {awaitingStart ? (
          <div className="flex flex-1 items-center justify-center px-10">
            <div className="max-w-[30rem]">
              <p className="font-apparatus text-[10.5px] uppercase tracking-[0.14em] text-graphite-35">
                Ready when you are
              </p>
              <p className="mt-4 font-question text-[19px] font-light leading-[1.6] text-graphite">
                You are interviewing as {candidateName}. The questions are
                planned from their own 31 days, and get harder or easier
                depending on how you answer.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAwaitingStart(false);
                  void send({ candidate: candidateId });
                }}
                className="font-apparatus mt-6 border border-graphite px-5 py-[9px] text-[10.5px] uppercase tracking-[0.12em] text-graphite transition-colors hover:bg-graphite hover:text-paper"
              >
                Begin interview →
              </button>
              <p className="font-apparatus mt-4 text-[10.5px] leading-[1.6] text-graphite-35">
                Nothing starts until you click. You can end it at any point and
                still get your feedback.
              </p>
            </div>
          </div>
        ) : (
          entries.length === 0 &&
          !thinking && (
            <div className="flex flex-1 items-center justify-center">
              <p className="font-apparatus text-[10.5px] uppercase tracking-[0.14em] text-graphite-35">
                opening
              </p>
            </div>
          )
        )}

        {/* Once the report is up it becomes the primary scroll region; the
            transcript keeps its own and shrinks rather than fighting it. */}
        <div className="flex min-h-0 flex-1 flex-col">
          <Conversation
            entries={entries}
            thinking={thinking}
            activeIndex={activeIndex}
            onHoverIndex={setActiveIndex}
          />
        </div>

        {awaitingStart ? null : done ? (
          <div className="border-t border-rule bg-paper-raised">
            <div className="mx-auto flex max-w-[46rem] items-center justify-between gap-4 px-10 py-6">
              <p className="font-apparatus text-[11.5px] text-graphite-60">
                This interview is finished.
              </p>
              <a
                href={`/report/${sessionId}`}
                className="font-apparatus border border-graphite px-4 py-[7px] text-[10.5px] uppercase tracking-[0.12em] text-graphite transition-colors hover:bg-graphite hover:text-paper"
              >
                Read your report →
              </a>
            </div>
          </div>
        ) : (
          <div>
            <Composer
              onSubmit={(text) => void send({ message: text }, text)}
              disabled={thinking || done}
              status={thinking ? "measuring…" : status}
            />
            <div className="border-t border-rule bg-paper-raised">
              <div className="mx-auto flex max-w-[46rem] justify-end px-10 pb-4">
                <button
                  type="button"
                  onClick={() => void endInterview()}
                  disabled={thinking || ending || done}
                  className="font-apparatus text-[10.5px] uppercase tracking-[0.12em] text-graphite-35 underline underline-offset-4 transition-colors hover:text-graphite disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                >
                  {ending ? "writing your report…" : "End interview"}
                </button>
              </div>
            </div>
          </div>
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
