"use client";

import { askPhrase } from "@/lib/depth";
import { type PanelData } from "./Panel";
import { ConversationTranscript, type Entry } from "./ConversationTranscript";

export function SignalPanel({
  data,
  entries,
  thinking,
  activeIndex,
  onHoverIndex,
}: {
  data: PanelData | null;
  entries: Entry[];
  thinking: boolean;
  activeIndex: number | null;
  onHoverIndex?: (i: number | null) => void;
}) {
  const s = data?.state;

  return (
    <aside className="hidden lg:flex flex-col w-[340px] shrink-0 bg-[var(--app-glass)] backdrop-blur-xl border border-[var(--app-border)] rounded-2xl shadow-2xl h-full overflow-hidden">
      <div className="p-6 border-b border-[var(--app-border)] bg-[var(--app-glass-2)]">
        <div className="font-sans font-semibold text-[10px] uppercase tracking-[0.14em] text-[var(--app-muted)] mb-6">
          Interview Signal
        </div>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans font-medium text-[11px] text-[var(--app-muted)]">Topics explored</span>
            <span className="font-sans font-semibold text-[12px] tabular-nums text-[var(--app-fg-strong)]">
              {s?.daysCovered.length ?? 0} <span className="text-[var(--app-muted)]">/ {data?.plan.focusDays.length ?? 4}</span>
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans font-medium text-[11px] text-[var(--app-muted)]">Questions</span>
            <span className="font-sans font-semibold text-[12px] tabular-nums text-[var(--app-fg-strong)]">
              {s?.questionCount ?? 0}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans font-medium text-[11px] text-[var(--app-muted)]">Current depth</span>
            <span className="font-sans font-semibold text-[12px] tabular-nums text-[var(--app-fg-strong)]">
              {s?.currentDepth ?? 1} <span className="text-[var(--app-muted)]">/ 5</span>
            </span>
          </div>
        </div>

        {s && (
          <p className="mt-5 font-sans text-[11px] leading-[1.7] text-[var(--app-muted)]">
            Currently {askPhrase(s.currentDepth)}
            {s.mode === "pressure" && ", and pushing hard"}
            {s.mode === "recovery" && ", and easing off"}.
          </p>
        )}
        {data?.rationale && (
          <p className="mt-3 border-l border-[var(--app-border)] pl-3 font-sans text-[12px] leading-[1.7] text-[var(--app-fg)]">
            {data.rationale}
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-6 pt-6 pb-4">
          <div className="font-sans font-semibold text-[10px] uppercase tracking-[0.14em] text-[var(--app-muted)]">
            Conversation
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ConversationTranscript
            entries={entries}
            thinking={thinking}
            activeIndex={activeIndex}
            onHoverIndex={onHoverIndex}
            panelData={data}
          />
        </div>
      </div>
    </aside>
  );
}
