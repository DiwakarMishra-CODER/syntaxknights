"use client";

import { type PanelData } from "./Panel";

export function JourneyPanel({
  data,
}: {
  data: PanelData | null;
}) {
  const s = data?.state;
  const planDays = data?.plan.focusDays ?? [];
  const covered = new Set(s?.daysCovered ?? []);
  const currentDay = s?.currentDay ?? null;

  return (
    <aside className="hidden lg:flex flex-col w-[300px] shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl h-full">
      <div className="font-sans font-semibold text-[10px] uppercase tracking-[0.14em] text-[#7E8B84] mb-8">
        Interview Journey
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-4">
        <ul className="space-y-4">
          {planDays.map((f) => {
            const isCovered = covered.has(f.day) && currentDay !== f.day;
            const isCurrent = currentDay === f.day;

            return (
              <li
                key={f.day}
                className="flex items-start gap-3 transition-opacity duration-300"
              >
                <div className="mt-[2px] flex items-center justify-center w-4 h-4 shrink-0">
                  {isCovered ? (
                    <svg className="w-4 h-4 text-[#7E8B84]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse shadow-[0_0_8px_rgba(22,163,74,0.6)]" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full border border-white/20" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-sans text-[14px] leading-tight transition-all duration-300 ${
                      isCurrent
                        ? "text-[#F5F7F4] font-semibold"
                        : isCovered
                        ? "text-[#7E8B84] line-through decoration-white/20"
                        : "text-[#7E8B84]/60"
                    }`}
                  >
                    {f.title}
                  </span>
                  {isCurrent && (
                    <span className="font-sans font-semibold text-[10px] text-[#16A34A] mt-1 uppercase tracking-widest">
                      Active
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
