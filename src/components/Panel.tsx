"use client";

import { useState } from "react";

import { askPhrase } from "@/lib/depth";
import type { TopicReach } from "@/lib/summary";

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
    depthCeiling: number;
    depthBand: string;
    depthViolations: number;
  };
  depthHistory: Array<{
    depth: number;
    day: number | null;
    title: string | null;
    measured: boolean;
  }>;
  rationale: string | null;
  claims: Array<{ text: string; day: number; unjustified: boolean; contradicted: boolean }>;
  /** The real shape, not a copy — a structural duplicate here silently drifts
   *  out of date the moment a field is added to TopicReach, which is how the
   *  report ended up unable to see the answer scores at all. */
  topics: TopicReach[];
  unjustified: Array<{ text: string; day: number }>;
  /** Knowing it vs saying it. Null when the two track each other. */
  explanation: string | null;
  comparison: {
    record: string;
    interview: string;
    alignment: "consistent" | "outperformed" | "underperformed";
    note: string;
  } | null;
}

/** Enough to show the thread of the conversation without burying the panel. */
const CLAIMS_SHOWN = 5;

/**
 * Claims are extracted mid-sentence from the candidate's own words, so they
 * arrive lowercase — "split it into a triage agent that…" — which is most of
 * why they read as broken. Capitalising is presentation only; rewriting them
 * would reintroduce the invention `filterInventedClaims` exists to prevent.
 */
function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
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
  const [showInternals, setShowInternals] = useState(false);

  const points: TracePoint[] = data?.depthHistory ?? [];
  const s = data?.state;
  const planDays = data?.plan.focusDays ?? [];
  const covered = new Set(s?.daysCovered ?? []);

  return (
    <aside className="flex h-screen w-[460px] shrink-0 flex-col overflow-hidden border-l border-rule bg-paper-raised">
      <header className="shrink-0 px-5 pb-4 pt-6">
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

      {/* ONE scroll region for everything else. Pinning the reasoning and the
          chart as well left nothing for the sections below them on a short
          window — they overflowed the aside and were clipped by main. */}
      <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto">
      <section className="border-t border-rule px-5 py-4">
        <h2 className="font-apparatus text-[9.5px] uppercase tracking-[0.09em] text-graphite-35">
          Why this question
        </h2>
        {data?.rationale ? (
          <p className="font-apparatus mt-2 text-[13px] leading-[1.7] text-graphite">
            {data.rationale}
          </p>
        ) : (
          <p className="font-apparatus mt-2 text-[13px] text-graphite-35">
            waiting for the first answer
          </p>
        )}
        {s && (
          <p className="font-apparatus mt-2 text-[11.5px] leading-[1.7] text-graphite-60">
            Currently {askPhrase(s.currentDepth)}
            {s.mode === "pressure" && ", and pushing hard"}
            {s.mode === "recovery" && ", and easing off"}.
          </p>
        )}
      </section>

      {/* The trace runs full-bleed — instrument paper meets the edge of the roll. */}
      <div className="border-t border-rule bg-paper py-3">
        <div className="px-5 pb-2">
          <div className="font-apparatus text-[9.5px] uppercase tracking-[0.09em] text-graphite-35">
            Depth
          </div>
          <p className="font-apparatus mt-1 text-[10px] leading-[1.6] text-graphite-35">
            The line rises as questions get harder within a topic. It restarts
            when the topic changes.
          </p>
        </div>
        <DepthTrace
          points={points}
          thinking={thinking}
          activeIndex={activeIndex}
          onHoverIndex={onHoverIndex}
        />
      </div>

      <div>
        <Section label="Progress">
          <Row
            label="questions"
            value={`${s?.questionCount ?? 0}`}
            note={`of ${data?.floors.minQuestions ?? 8} minimum`}
          />
          <Row
            label="days covered"
            value={`${s?.daysCovered.length ?? 0}`}
            note={`of ${data?.floors.minDays ?? 4} minimum`}
          />

          {/* Real instruments, meaningless to a visitor in five seconds. Kept,
              not deleted — a technical judge who opens this should find
              telemetry, not a summary of it. */}
          <button
            type="button"
            onClick={() => setShowInternals((v) => !v)}
            className="font-apparatus mt-2 text-[10px] uppercase tracking-[0.1em] text-graphite-35 transition-colors hover:text-graphite"
            aria-expanded={showInternals}
          >
            {showInternals ? "▾" : "▸"} internals
          </button>

          {showInternals && s && (
            <div className="mt-1 border-l border-rule pl-3">
              <Row label="ability" value={s.abilityEstimate.toFixed(2)} note="of 5" />
              <Row
                label="depth"
                value={`${s.currentDepth}`}
                note={`${s.depthBand} · ceiling ${s.depthCeiling}`}
              />
              <Row
                label="follow-ups"
                value={`${s.followUpCount}`}
                note={`/ ${s.followUpAllowance}`}
              />
              <Row label="mode" value={s.mode} />
              {s.depthViolations > 0 && (
                <Row
                  label="off-plan"
                  value={`${s.depthViolations}`}
                  note="asked at another rung"
                />
              )}
            </div>
          )}
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

        {/* Was "Claims", rendered as unframed lowercase sentence fragments —
            a visitor could not tell whose words they were or why they were
            listed, and unbounded it was the largest thing in the panel. */}
        <Section label="You said">
          <p className="font-apparatus mb-2 text-[10.5px] leading-[1.6] text-graphite-35">
            Details from your own answers. Anything you have not backed up yet
            is marked.
          </p>
          {data && data.claims.length > 0 ? (
            <ul className="space-y-2">
              {data.claims.slice(-CLAIMS_SHOWN).map((c, i) => (
                <li
                  key={i}
                  className={`font-apparatus text-[11px] leading-[1.6] ${
                    c.contradicted ? "text-trace" : "text-graphite-60"
                  }`}
                >
                  {c.contradicted && <span className="mr-1">contradiction —</span>}
                  {sentenceCase(c.text)}
                  {c.unjustified && !c.contradicted && (
                    <span className="ml-1.5 text-graphite-35">· unverified</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-apparatus text-[11px] text-graphite-35">
              nothing to show yet
            </p>
          )}
          {data && data.claims.length > CLAIMS_SHOWN && (
            <p className="font-apparatus mt-2 text-[10.5px] text-graphite-35">
              +{data.claims.length - CLAIMS_SHOWN} earlier
            </p>
          )}
        </Section>
      </div>
      </div>
    </aside>
  );
}
