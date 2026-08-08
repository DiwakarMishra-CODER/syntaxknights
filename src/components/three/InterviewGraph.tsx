"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InterviewGraphProps {
  activeStage: "answer" | "evaluate" | "understand" | "adapt" | "followup";
}

const STAGES = [
  { id: "answer", label: "Answer" },
  { id: "evaluate", label: "Evaluate" },
  { id: "understand", label: "Understand" },
  { id: "adapt", label: "Adapt" },
  { id: "followup", label: "Next Question" },
];

export const InterviewGraph: React.FC<InterviewGraphProps> = ({ activeStage }) => {
  const activeIdx = STAGES.findIndex((s) => s.id === activeStage);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 glass-emerald w-full text-xs font-mono text-[#F3F7F5]">
      {STAGES.map((stg, idx) => {
        const isActive = idx <= activeIdx;
        const isCurrent = stg.id === activeStage;

        return (
          <React.Fragment key={stg.id}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  isCurrent
                    ? "bg-[#36E6B0] shadow-[0_0_12px_#36E6B0] scale-125"
                    : isActive
                    ? "bg-[#159B78]"
                    : "bg-slate-700"
                )}
              />
              <span
                className={cn(
                  "transition-colors duration-300",
                  isCurrent
                    ? "text-[#36E6B0] font-semibold"
                    : isActive
                    ? "text-[#F3F7F5]"
                    : "text-[#91A6A0]"
                )}
              >
                {stg.label}
              </span>
            </div>

            {idx < STAGES.length - 1 && (
              <div className="hidden sm:block h-px w-6 bg-slate-800 relative overflow-hidden">
                {isActive && (
                  <div className="absolute inset-0 bg-[#36E6B0] animate-pulse" />
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
