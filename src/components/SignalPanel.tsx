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
    <aside className="hidden lg:flex flex-col w-[340px] shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl h-full overflow-hidden">
      <div className="p-6 border-b border-white/10 bg-white/5">
        <div className="font-sans font-semibold text-[10px] uppercase tracking-[0.14em] text-[#7E8B84] mb-6">
          Interview Signal
        </div>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans font-medium text-[11px] text-[#7E8B84]">Topics explored</span>
            <span className="font-sans font-semibold text-[12px] tabular-nums text-[#F5F7F4]">
              {s?.daysCovered.length ?? 0} <span className="text-[#7E8B84]">/ {data?.plan.focusDays.length ?? 4}</span>
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans font-medium text-[11px] text-[#7E8B84]">Questions</span>
            <span className="font-sans font-semibold text-[12px] tabular-nums text-[#F5F7F4]">
              {s?.questionCount ?? 0}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans font-medium text-[11px] text-[#7E8B84]">Current depth</span>
            <span className="font-sans font-semibold text-[12px] tabular-nums text-[#F5F7F4]">
              {s?.currentDepth ?? 1} <span className="text-[#7E8B84]">/ 5</span>
            </span>
          </div>
        </div>

        {/* Why this question.
            The one element that shows the machine reasoning about a specific
            answer rather than asserting that it does -- and the most
            persuasive thing on the screen. Plain English on purpose: "3 / 5"
            and "pressure" both need a legend nobody has. */}
        {s && (
          <p className="mt-5 font-sans text-[11px] leading-[1.7] text-[#7E8B84]">
            Currently {askPhrase(s.currentDepth)}
            {s.mode === "pressure" && ", and pushing hard"}
            {s.mode === "recovery" && ", and easing off"}.
          </p>
        )}
        {data?.rationale && (
          <p className="mt-3 border-l border-white/10 pl-3 font-sans text-[12px] leading-[1.7] text-[#F5F7F4]/90">
            {data.rationale}
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-6 pt-6 pb-4">
          <div className="font-sans font-semibold text-[10px] uppercase tracking-[0.14em] text-[#7E8B84]">
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
