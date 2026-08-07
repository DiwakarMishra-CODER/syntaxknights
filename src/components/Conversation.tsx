"use client";

import { useEffect, useRef } from "react";

/**
 * Append-only transcript. Entries are never re-rendered once placed —
 * re-rendering flickers and kills the conversational illusion.
 *
 * Nothing here signals correctness: no score, tick, cross or colour. The
 * interviewer never tells you whether you were right, so the UI must not
 * leak it either.
 */

export type EntryKind = "ack" | "question" | "answer" | "closing";

export interface Entry {
  id: string;
  kind: EntryKind;
  text: string;
  /** Index into the depth trace, for cross-highlighting. */
  traceIndex: number | null;
}

export function Conversation({
  entries,
  thinking,
  activeIndex,
  onHoverIndex,
}: {
  entries: Entry[];
  thinking: boolean;
  activeIndex: number | null;
  onHoverIndex?: (i: number | null) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length, thinking]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[46rem] px-10 py-14">
        {entries.map((e) => {
          const dim = activeIndex !== null && e.traceIndex !== activeIndex;

          if (e.kind === "answer") {
            return (
              <div key={e.id} className="mb-10 flex justify-end">
                <p
                  className={`max-w-[32rem] border-l border-rule pl-4 font-apparatus text-[12.5px] leading-[1.75] text-graphite-60 transition-opacity duration-200 ${
                    dim ? "opacity-35" : "opacity-100"
                  }`}
                >
                  {e.text}
                </p>
              </div>
            );
          }

          if (e.kind === "ack") {
            return (
              <p
                key={e.id}
                className={`mb-3 font-question text-[20px] font-light text-graphite-35 transition-opacity duration-200 ${
                  dim ? "opacity-35" : "opacity-100"
                }`}
              >
                {e.text}
              </p>
            );
          }

          return (
            <p
              key={e.id}
              onMouseEnter={() => e.traceIndex !== null && onHoverIndex?.(e.traceIndex)}
              onMouseLeave={() => onHoverIndex?.(null)}
              className={`mb-10 max-w-[34rem] font-question text-[27px] font-light leading-[1.5] tracking-[-0.005em] text-graphite transition-opacity duration-200 ${
                dim ? "opacity-35" : "opacity-100"
              }`}
            >
              {e.text}
            </p>
          );
        })}

        {thinking && (
          <p
            className="font-apparatus text-[10.5px] uppercase tracking-[0.14em] text-graphite-35"
            aria-live="polite"
          >
            measuring
          </p>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
