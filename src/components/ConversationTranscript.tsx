"use client";

import { useEffect, useRef } from "react";
import { type PanelData } from "./Panel";

export type EntryKind = "ack" | "question" | "answer" | "closing";

export interface Entry {
  id: string;
  kind: EntryKind;
  text: string;
  /** Index into the depth trace, for cross-highlighting. */
  traceIndex: number | null;
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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length, thinking]);

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
          <div className="font-sans font-semibold text-[10px] uppercase tracking-widest text-[#7E8B84] mb-2">
            Q{currentQuestionIndex} · {topicTitle} · Depth {depthInfo?.depth ?? "?"}
          </div>
          <div className="font-editorial text-[14px] leading-[1.5] text-[#F5F7F4] mb-3">
            {e.text}
          </div>
        </div>
      );
    } else if (e.kind === "answer") {
      blockContent.push(
        <div key={e.id} className={`px-6 mb-4 transition-opacity duration-200 ${opacityClass}`}>
          <div className="font-sans text-[12px] leading-[1.6] text-[#CFD7D0] border-l border-white/10 pl-3">
            {e.text}
          </div>
        </div>
      );
    } else if (e.kind === "ack") {
      // Typically we might not show acks in the transcript, but if we do:
      blockContent.push(
        <div key={e.id} className={`px-6 mb-2 transition-opacity duration-200 ${opacityClass}`}>
          <div className="font-editorial text-[13px] text-[#7E8B84] italic">
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
        <div className="px-6 mt-4">
          <span className="font-sans font-medium text-[10px] uppercase tracking-[0.14em] text-[#7E8B84] animate-pulse">
            Considering...
          </span>
        </div>
      )}
      
      <div ref={endRef} />
    </div>
  );
}
