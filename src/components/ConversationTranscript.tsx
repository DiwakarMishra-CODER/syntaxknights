"use client";

import { useEffect, useRef } from "react";

import { shouldFollow } from "./conversationScroll";
import { type PanelData } from "./Panel";

export type EntryKind = "ack" | "question" | "answer" | "closing";

export interface Entry {
  id: string;
  kind: EntryKind;
  text: string;
  /** Index into the depth trace, for cross-highlighting. */
  traceIndex: number | null;
}

/** The scroll box is owned by SignalPanel, not by this component. */
function nearestScrollable(from: HTMLElement | null): HTMLElement | null {
  for (let n = from; n; n = n.parentElement) {
    const oy = getComputedStyle(n).overflowY;
    if (oy === "auto" || oy === "scroll") return n;
  }
  return null;
}

export function ConversationTranscript({
  entries,
  thinking,
  activeIndex,
  onHoverIndex,
  panelData,
}: {
  entries: Entry[];
  thinking: boolean;
  activeIndex: number | null;
  onHoverIndex?: (i: number | null) => void;
  panelData: PanelData | null;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  // Follow the newest turn only when the reader is already following.
  //
  // This was an unconditional scrollIntoView keyed on entries.length AND
  // thinking, so it fired up to four times a turn -- and scrollIntoView
  // moves every scrollable ancestor, not just this box. Scrolling up to
  // re-read an earlier answer was undone before you could finish reading.
  const stuck = useRef(true);
  const scroller = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = nearestScrollable(endRef.current);
    scroller.current = el;
    if (!el) return;

    const onScroll = () => {
      stuck.current = shouldFollow(el.scrollTop, el.scrollHeight, el.clientHeight);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (el && stuck.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [entries.length]);

  // Group entries by question sequence to format nicely
  const transcriptBlocks: React.ReactNode[] = [];
  let currentQuestionIndex = 0;
  let blockContent: React.ReactNode[] = [];
  
  const pushBlock = () => {
    if (blockContent.length > 0) {
      transcriptBlocks.push(
        <div key={`block-${transcriptBlocks.length}`} className="mb-8">
          {blockContent}
        </div>
      );
      blockContent = [];
    }
  };

  entries.forEach((e) => {
    const dim = activeIndex !== null && e.traceIndex !== activeIndex;
    const opacityClass = dim ? "opacity-30" : "opacity-100";
    
    // We try to grab the depth for the traceIndex if available
    const depthInfo = (e.traceIndex !== null && panelData?.depthHistory) 
        ? panelData.depthHistory[e.traceIndex] 
        : null;

    if (e.kind === "question" || e.kind === "closing") {
      currentQuestionIndex++;
      pushBlock();
      
      const topicTitle = depthInfo && depthInfo.day !== null && panelData?.plan.focusDays
          ? panelData.plan.focusDays.find(d => d.day === depthInfo.day)?.title || `Day ${depthInfo.day}`
          : "General";

      blockContent.push(
        <div 
          key={e.id}
          className={`transition-opacity duration-200 cursor-default px-6 ${opacityClass}`}
          onMouseEnter={() => e.traceIndex !== null && onHoverIndex?.(e.traceIndex)}
          onMouseLeave={() => onHoverIndex?.(null)}
        >
          <div className="font-sans font-semibold text-[10px] uppercase tracking-widest text-[var(--app-muted)] mb-2">
            Q{currentQuestionIndex} · {topicTitle} · Depth {depthInfo?.depth ?? "?"}
          </div>
          <div className="font-sans text-[14px] leading-[1.5] text-[var(--app-fg-strong)] mb-3">
            {e.text}
          </div>
        </div>
      );
    } else if (e.kind === "answer") {
      blockContent.push(
        <div key={e.id} className={`px-6 mb-4 transition-opacity duration-200 ${opacityClass}`}>
          <div className="font-sans text-[12px] leading-[1.6] text-[var(--app-fg)] border-l border-[var(--app-border)] pl-3">
            {e.text}
          </div>
        </div>
      );
    } else if (e.kind === "ack") {
      // Typically we might not show acks in the transcript, but if we do:
      blockContent.push(
        <div key={e.id} className={`px-6 mb-2 transition-opacity duration-200 ${opacityClass}`}>
          <div className="font-sans text-[13px] text-[var(--app-muted)] italic">
            {e.text}
          </div>
        </div>
      );
    }
  });
  
  pushBlock();

  return (
    <div className="flex-1 pb-14">
      {transcriptBlocks}
      
      {thinking && (
        <div className="px-6 mt-6 mb-8 transition-opacity duration-300">
          <div className="font-sans font-semibold text-[10px] uppercase tracking-widest text-[var(--app-muted)] mb-3 animate-pulse">
            Generating Question...
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-[var(--app-glass-2)] rounded-full w-3/4 animate-pulse"></div>
            <div className="h-3 bg-[var(--app-glass-2)] rounded-full w-full animate-pulse delay-75"></div>
            <div className="h-3 bg-[var(--app-glass-2)] rounded-full w-5/6 animate-pulse delay-150"></div>
          </div>
        </div>
      )}
      
      <div ref={endRef} />
    </div>
  );
}
