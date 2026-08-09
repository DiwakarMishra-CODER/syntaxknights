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
    <aside className="hidden lg:flex h-full w-[380px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-glass)] p-6 shadow-2xl backdrop-blur-xl">
      <div className="font-sans font-semibold text-[10px] uppercase tracking-[0.14em] text-[var(--app-muted)] mb-8">
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
                    <svg className="w-4 h-4 text-[var(--app-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--app-accent)] animate-pulse shadow-[0_0_8px_rgba(22,163,74,0.6)]" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full border border-[var(--app-border)]" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-sans text-[14px] leading-tight transition-all duration-300 ${
                      isCurrent
                        ? "text-[var(--app-fg-strong)] font-semibold"
                        : isCovered
                        ? "text-[var(--app-muted)] line-through"
                        : "text-[var(--app-muted-2)]"
                    }`}
                  >
                    {f.title}
                  </span>
                  {isCurrent && (
                    <span className="font-sans font-semibold text-[10px] text-[var(--app-accent-text)] mt-1 uppercase tracking-widest">
                      Active
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <section className="mt-8 border-t border-[var(--app-border)] pt-6">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--app-muted)]">
            Interview depth
          </div>
          <p className="mt-2 font-sans text-[11px] leading-[1.6] text-[var(--app-muted)]">
            Each dot is a question. It moves right as the questions get harder,
            and starts again when the topic changes.
          </p>

          {points.length === 0 ? (
            <p className="mt-6 font-sans text-[11px] leading-[1.6] text-[var(--app-muted-2)]">
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
