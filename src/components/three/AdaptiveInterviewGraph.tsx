"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AdaptiveInterviewGraphProps {
  activeStage?: "answer" | "understand" | "evaluate" | "adapt" | "followup";
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
    <div className="flex flex-col items-start gap-5 h-full justify-center py-4 relative">
      {STAGES.map((stg, idx) => {
        const isActive = idx <= activeIdx;
        const isCurrent = idx === activeIdx;

        return (
          <div key={stg.id} className="relative flex items-center gap-3.5 group">
            {/* Connecting line */}
            {idx < STAGES.length - 1 && (
              <div className="absolute left-[3px] top-[14px] w-[2px] h-[24px] bg-[rgba(255,255,255,0.06)]">
                {isActive && activeIdx > idx && (
                  <div className="w-full h-full bg-[#1FD16A] shadow-[0_0_8px_#1FD16A]" />
                )}
              </div>
            )}

            {/* Node Dot */}
            <div className="relative flex items-center justify-center">
              <span
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-500",
                  isCurrent
                    ? "bg-[#1FD16A] shadow-[0_0_12px_#1FD16A] scale-125"
                    : isActive
                    ? "bg-[#1FD16A] opacity-80 scale-100"
                    : "bg-[#7E8B84] opacity-40 scale-100"
                )}
              />
            </div>

            {/* Label */}
            <span
              className={cn(
                "text-xs transition-colors duration-500",
                isCurrent
                  ? "text-[#F5F7F4] font-medium"
                  : isActive
                  ? "text-[#F5F7F4]/90"
                  : "text-[#7E8B84]"
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
