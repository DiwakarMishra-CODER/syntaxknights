"use client";

import { DepthTrace, type TracePoint } from "./DepthTrace";
import { type PanelData } from "./Panel";

export function JourneyPanel({
  data,
  thinking = false,
  activeIndex = null,
  onHoverIndex,
}: {
  data: PanelData | null;
  thinking?: boolean;
  activeIndex?: number | null;
  onHoverIndex?: (i: number | null) => void;
}) {
  const s = data?.state;
  const points: TracePoint[] = data?.depthHistory ?? [];
  const planDays = data?.plan.focusDays ?? [];
  const covered = new Set(s?.daysCovered ?? []);
  const currentDay = s?.currentDay ?? null;

  return (
    <aside className="hidden lg:flex h-full w-[380px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
      <div className="font-sans font-semibold text-[10px] uppercase tracking-[0.14em] text-[#7E8B84] mb-8">
        Interview Journey
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-4">
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

        <section className="mt-8 border-t border-white/10 pt-6">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7E8B84]">
            Interview depth
          </div>
          {/* It said "INTERVIEW DEPTH" and nothing else, so a viewer had no
              way to know what a dot was or which direction meant harder. */}
          <p className="mt-2 font-sans text-[11px] leading-[1.6] text-[#7E8B84]/80">
            Each dot is a question. It moves right as the questions get harder,
            and starts again when the topic changes.
          </p>

          {points.length === 0 ? (
            <p className="mt-6 font-sans text-[11px] leading-[1.6] text-[#7E8B84]/60">
              The line appears as you answer.
            </p>
          ) : (
            <div className="mt-4">
              <DepthTrace
                points={points}
                thinking={thinking}
                activeIndex={activeIndex}
                onHoverIndex={onHoverIndex}
              />
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
