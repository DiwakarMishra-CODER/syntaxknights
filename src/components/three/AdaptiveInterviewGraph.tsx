"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AdaptiveInterviewGraphProps {
  activeStage?: "answer" | "evaluate" | "understand" | "adapt" | "followup";
}

const STAGES = [
  { id: "answer", label: "Your Answer" },
  { id: "understand", label: "Understand" },
  { id: "evaluate", label: "Evaluate" },
  { id: "adapt", label: "Adapt" },
  { id: "followup", label: "Next Probe" },
];

export const AdaptiveInterviewGraph: React.FC<AdaptiveInterviewGraphProps> = ({
  activeStage = "evaluate",
}) => {
  const stageMap: Record<string, number> = {
    answer: 0,
    understand: 1,
    evaluate: 2,
    adapt: 3,
    followup: 4,
  };

  const activeIdx = stageMap[activeStage] ?? 2;

  return (
    <div className="flex flex-col items-start gap-5 h-full justify-center py-4 relative font-sans">
      {STAGES.map((stg, idx) => {
        const isActive = idx <= activeIdx;
        const isCurrent = idx === activeIdx;

        return (
          <div key={stg.id} className="relative flex items-center gap-3.5 group">
            {/* Connecting line */}
            {idx < STAGES.length - 1 && (
              <div className="absolute left-[3px] top-[14px] w-[2px] h-[24px] bg-[rgba(255,255,255,0.08)]">
                {isActive && activeIdx > idx && (
                  <div className="w-full h-full bg-[#43D8CB] shadow-[0_0_8px_#43D8CB]" />
                )}
              </div>
            )}

            {/* Node Dot */}
            <div className="relative flex items-center justify-center">
              <span
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-500",
                  isCurrent
                    ? "bg-[#43D8CB] shadow-[0_0_12px_#43D8CB] scale-125"
                    : isActive
                    ? "bg-[#43D8CB] opacity-80 scale-100"
                    : "bg-[#9BA19F] opacity-40 scale-100"
                )}
              />
            </div>

            {/* Label */}
            <span
              className={cn(
                "text-xs transition-colors duration-500 font-sans",
                isCurrent
                  ? "text-[#F4F4EF] font-medium"
                  : isActive
                  ? "text-[#F4F4EF]/90"
                  : "text-[#9BA19F]"
              )}
            >
              {stg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
