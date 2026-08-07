"use client";

import { DepthTrace, type TracePoint } from "./DepthTrace";

/**
 * The instrument panel: one continuous strip of ruled paper with an
 * annotation gutter, the way a chart recorder prints labels in the margin.
 * Deliberately NOT a stack of cards — no boxes, no shadows, no radii.
 */

export interface PanelData {
  candidate: {
    name: string;
    jobRole: string;
    yearsExperience: number;
    missionsCompleted: number;
    missionsFirstTry: number;
  };
  plan: { targetQuestions: number; focusDays: Array<{ day: number; title: string }> };
  floors: { minQuestions: number; minDays: number };
  state: {
    questionCount: number;
    daysCovered: number[];
    currentDay: number;
    currentDepth: number;
    followUpCount: number;
    followUpAllowance: number;
    abilityEstimate: number;
    mode: string;
  };
  depthHistory: Array<{ depth: number; day: number | null; measured: boolean }>;
  rationale: string | null;
  claims: Array<{ text: string; day: number; unjustified: boolean; contradicted: boolean }>;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-[64px_1fr] gap-x-3 border-t border-rule px-5 py-4">
      <div className="font-apparatus text-[9.5px] uppercase tracking-[0.09em] text-graphite-35 pt-[3px]">
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px]">
      <span className="font-apparatus text-[11px] text-graphite-60">{label}</span>
      <span className="font-apparatus text-[12px] tabular-nums text-graphite">
        {value}
        {note && <span className="ml-1.5 text-graphite-35">{note}</span>}
      </span>
    </div>
  );
}

export function Panel({
  data,
  thinking,
  activeIndex,
  onHoverIndex,
}: {
  data: PanelData | null;
  thinking: boolean;
  activeIndex: number | null;
  onHoverIndex?: (i: number | null) => void;
}) {
  const points: TracePoint[] = data?.depthHistory ?? [];
  const s = data?.state;
  const planDays = data?.plan.focusDays ?? [];
  const covered = new Set(s?.daysCovered ?? []);

  return (
    <aside className="flex h-screen w-[380px] shrink-0 flex-col border-l border-rule bg-paper-raised">
      <header className="px-5 pb-4 pt-6">
        <h1 className="font-apparatus text-[12px] uppercase tracking-[0.14em] text-graphite">
          {data?.candidate.name ?? "—"}
        </h1>
        <p className="font-apparatus mt-1 text-[10.5px] leading-relaxed text-graphite-35">
          {data
            ? `${data.candidate.jobRole} · ${data.candidate.yearsExperience}y experience`
            : "awaiting session"}
          {data && (
            <>
              <br />
              {data.candidate.missionsCompleted}/31 days ·{" "}
              {Math.round(
                (data.candidate.missionsFirstTry /
                  Math.max(data.candidate.missionsCompleted, 1)) *
                  100
              )}
              % first try
            </>
          )}
        </p>
      </header>

      {/* The trace runs full-bleed — instrument paper meets the edge of the roll. */}
      <div className="border-t border-rule bg-paper py-3">
        <div className="font-apparatus px-5 pb-2 text-[9.5px] uppercase tracking-[0.09em] text-graphite-35">
          Depth
        </div>
        <DepthTrace
          points={points}
          thinking={thinking}
          activeIndex={activeIndex}
          onHoverIndex={onHoverIndex}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section label="Why this">
          {data?.rationale ? (
            <p className="font-apparatus text-[11.5px] leading-[1.7] text-graphite-60">
              {data.rationale}
            </p>
          ) : (
            <p className="font-apparatus text-[11.5px] text-graphite-35">—</p>
          )}
        </Section>

        <Section label="Progress">
          <Row
            label="questions"
            value={`${s?.questionCount ?? 0}`}
            note={`/ ${data?.floors.minQuestions ?? 8} min`}
          />
          <Row
            label="days"
            value={`${s?.daysCovered.length ?? 0}`}
            note={`/ ${data?.floors.minDays ?? 4} min`}
          />
          <Row label="ability" value={s ? s.abilityEstimate.toFixed(2) : "—"} />
          <Row
            label="follow-ups"
            value={`${s?.followUpCount ?? 0}`}
            note={`/ ${s?.followUpAllowance ?? 3}`}
          />
          <Row label="mode" value={s?.mode ?? "—"} />
        </Section>

        <Section label="Coverage">
          <ul className="space-y-[3px]">
            {planDays.map((f) => {
              const hit = covered.has(f.day);
              return (
                <li
                  key={f.day}
                  className="font-apparatus flex items-baseline gap-2 text-[11px]"
                >
                  <span
                    aria-hidden
                    className={`mt-[5px] h-[5px] w-[5px] shrink-0 ${
                      hit ? "bg-graphite" : "border border-graphite-35"
                    }`}
                  />
                  <span className={hit ? "text-graphite" : "text-graphite-35"}>
                    {f.title}
                  </span>
                </li>
              );
            })}
            {/* Days visited that were not in the plan still count as coverage. */}
            {(s?.daysCovered ?? [])
              .filter((d) => !planDays.some((f) => f.day === d))
              .map((d) => (
                <li key={`x-${d}`} className="font-apparatus flex items-baseline gap-2 text-[11px]">
                  <span aria-hidden className="mt-[5px] h-[5px] w-[5px] shrink-0 bg-graphite" />
                  <span className="text-graphite">day {d}</span>
                </li>
              ))}
          </ul>
        </Section>

        <Section label="Claims">
          {data && data.claims.length > 0 ? (
            <ul className="space-y-2">
              {data.claims.map((c, i) => (
                <li
                  key={i}
                  className={`font-apparatus text-[11px] leading-[1.6] ${
                    c.contradicted ? "text-trace" : "text-graphite-60"
                  }`}
                >
                  {c.contradicted && <span className="mr-1">contradiction —</span>}
                  {c.text}
                  {c.unjustified && !c.contradicted && (
                    <span className="ml-1.5 text-graphite-35">· unverified</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-apparatus text-[11px] text-graphite-35">nothing claimed yet</p>
          )}
        </Section>
      </div>
    </aside>
  );
}
