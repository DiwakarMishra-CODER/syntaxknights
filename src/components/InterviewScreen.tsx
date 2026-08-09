"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { type Entry } from "./ConversationTranscript";
import { MainInterview } from "./MainInterview";
import { type PanelData } from "./Panel";
import { sound } from "@/lib/sound";

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
        }
        void refreshPanel();
      } catch {
        setThinking(false);
        setStatus("Connection lost. Send again to continue.");
      }
    },
    [refreshPanel, speak]
  );

  const endInterview = useCallback(async () => {
    if (ending || thinking || done) return;
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
    <main className="relative flex h-screen w-full flex-col justify-between overflow-hidden bg-[var(--app-bg)] text-[var(--app-fg)]">
      {/* Background ambient glows blending seamlessly */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10%] h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-[var(--app-accent)] opacity-[0.05] mix-blend-screen blur-[150px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[var(--app-accent)] opacity-[0.04] mix-blend-screen blur-[130px]" />
      </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--app-overlay)] backdrop-blur-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 rounded-full border-2 border-[var(--app-accent)] border-t-transparent animate-spin" />
            <p className="font-sans text-sm font-medium text-[var(--app-muted)]">
              Generating technical interview report...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
