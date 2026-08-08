"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { type Entry } from "./ConversationTranscript";
import { JourneyPanel } from "./JourneyPanel";
import { MainInterview } from "./MainInterview";
import { type PanelData } from "./Panel";
import { SignalPanel } from "./SignalPanel";

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
  // The server joins reaction and question with a blank line, so normally
  // there is nothing to guess.
  const seam = reply.indexOf("\n\n");
  if (seam > 0) {
    const ack = reply.slice(0, seam).trim();
    const question = reply.slice(seam + 2).trim();
    if (ack && question) return { ack, question };
  }

  // Sessions recorded before the seam existed, where the two were joined
  // with a space. Deliberately conservative: a short leading sentence only,
  // because everything longer is more likely to be part of the question.
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
    <main className="relative flex h-screen gap-4 overflow-hidden bg-[#050806] p-4 text-[#F5F7F4]">
      {/* Their ambient glows. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-[#1FD16A] opacity-[0.03] mix-blend-screen blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50%] w-[50%] rounded-full bg-[#1FD16A] opacity-[0.03] mix-blend-screen blur-[120px]" />
      </div>

      {awaitingStart ? (
        /* Nothing has been spent yet. Loading the page used to fire the
           planner, which is on the model capped at 20 requests per DAY per
           key -- four of seven sessions in one afternoon were opened and
           never answered. */
        <div className="relative z-10 flex flex-1 items-center justify-center px-8">
          <div className="max-w-[34rem] rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-xl">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7E8B84]">
              Ready when you are
            </p>
            <p className="mt-5 font-sans text-[19px] leading-[1.6] text-[#F5F7F4]">
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
              className="mt-8 rounded-full bg-[#1FD16A] px-6 py-3 font-sans text-[13px] font-semibold text-[#050806] transition-opacity hover:opacity-90"
            >
              Begin interview →
            </button>
            <p className="mt-5 font-sans text-[11px] leading-[1.6] text-[#7E8B84]">
              Nothing starts until you click. You can end it at any point and
              still get your feedback.
            </p>
          </div>
        </div>
      ) : (
        <>
          <JourneyPanel
            data={panel}
            thinking={thinking}
            activeIndex={activeIndex}
            onHoverIndex={setActiveIndex}
          />
          <MainInterview
            entries={entries}
            thinking={thinking}
            panelData={panel}
            onSubmit={(text) => void send({ message: text }, text)}
            done={done}
            status={thinking ? "measuring…" : status}
            activeIndex={activeIndex}
            onHoverIndex={setActiveIndex}
            /* Their Exit was a stub: it fabricated an empty feedback object
               and showed a blank screen. This writes the closing turn, marks
               the session done and routes to the real report. */
            onExit={() => void endInterview()}
          />
          <SignalPanel
            data={panel}
            entries={entries}
            thinking={thinking}
            activeIndex={activeIndex}
            onHoverIndex={setActiveIndex}
          />
        </>
      )}

      {ending && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050806]/80 backdrop-blur-sm">
          <p className="font-sans text-[13px] text-[#7E8B84]">
            writing your report…
          </p>
        </div>
      )}
    </main>
  );
}
