"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";

import { type Entry } from "./ConversationTranscript";
import { MainInterview } from "./MainInterview";
import { type PanelData } from "./Panel";
import { sound } from "@/lib/sound";
import { ProctorEngine } from "./ProctorEngine";

function formatInterviewerReply(reply: string): string {
  const seam = reply.indexOf("\n\n");
  if (seam > 0) {
    const ack = reply.slice(0, seam).trim();
    const question = reply.slice(seam + 2).trim();
    if (ack && question) {
      const cleanAck = ack.endsWith(".") || ack.endsWith("!") || ack.endsWith("?") 
        ? ack 
        : ack + ".";
      return `${cleanAck} ${question}`;
    }
  }
  return reply.trim();
}

let uid = 0;
const nextId = () => `e${uid++}`;

/** Long enough to read the interviewer's closing line before the report loads. */
const CLOSING_BEAT_MS = 2200;

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
  const [muted, setMuted] = useState(false);
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
      /* non-blocking instrument */
    }
  }, [sessionId]);

  const speak = useCallback((reply: string, closing: boolean) => {
    const formattedText = formatInterviewerReply(reply);
    const traceIndex = traceCount.current++;

    sound.playReceived();

    setEntries((prev) => [
      ...prev,
      {
        id: nextId(),
        kind: closing ? "closing" : "question",
        text: formattedText,
        traceIndex,
      },
    ]);
  }, []);

  const send = useCallback(
    async (body: Record<string, unknown>, showAnswer?: string) => {
      if (showAnswer) {
        sound.playSent();
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
          // The report is written and persisted BEFORE markDone (route.ts),
          // so by the time done:true arrives it is already in the DB and this
          // navigation lands on a finished page.
          //
          // Without this the interview simply stopped: the End button
          // early-returns once `done` is true, so nothing navigated and the
          // only way to the report was remounting the page. The report had
          // been generated, sent, and thrown away.
          //
          // The delay is for the closing beat — it is the interviewer's last
          // line and yanking the page away mid-sentence reads as a crash.
          setTimeout(() => router.push(`/report/${sessionId}`), CLOSING_BEAT_MS);
          return;
        }
        void refreshPanel();
      } catch {
        setThinking(false);
        setStatus("Connection lost. Send again to continue.");
      }
    },
    [refreshPanel, speak, router, sessionId]
  );

  const endInterview = useCallback(async () => {
    if (ending || thinking) return;
    // Already finished naturally: the report exists, so go straight to it
    // rather than posting an end for a session that is already done.
    if (done) {
      router.push(`/report/${sessionId}`);
      return;
    }
    setEnding(true);
    try {
      await fetch(`/api/session/${sessionId}/end`, { method: "POST" });
    } catch {
      /* safe fallback */
    }
    router.push(`/report/${sessionId}`);
  }, [ending, thinking, done, sessionId, router]);

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
            let restored = 0;
            setEntries(
              existing.transcript.map((t) => {
                const isCandidate = t.role === "candidate";
                return {
                  id: nextId(),
                  kind: isCandidate ? ("answer" as const) : ("question" as const),
                  text: isCandidate ? t.content : formatInterviewerReply(t.content),
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
        /* fallback */
      }
      void send({ candidate: candidateId });
    })();
  }, [candidateId, send, sessionId, router]);


  return (
    <main className="relative flex h-screen w-full flex-col justify-between overflow-hidden bg-slate-50 dark:bg-[#050806] text-slate-900 dark:text-[#F5F7F4] font-sans selection:bg-[#1FD16A]/25 selection:text-[#1FD16A] transition-colors duration-300">
      <ProctorEngine onForceEnd={endInterview} />
      


      {/* Full Bleed Seamless Chat Interface */}
      <div className="relative z-10 flex-1 flex flex-col w-full h-screen">
        <MainInterview
          entries={entries}
          thinking={thinking}
          panelData={panel}
          onSubmit={(text) => void send({ message: text }, text)}
          done={done}
          status={thinking ? "Evaluating..." : status}
          activeIndex={activeIndex}
          onHoverIndex={setActiveIndex}
          onExit={() => void endInterview()}
          muted={muted}
          onToggleMute={() => {
            const next = !muted;
            setMuted(next);
            sound.soundEnabled = !next;
          }}
        />
      </div>

      {ending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 dark:bg-[#050806]/80 backdrop-blur-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <p className="font-sans text-sm font-medium text-slate-500">
              Generating technical interview report...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
