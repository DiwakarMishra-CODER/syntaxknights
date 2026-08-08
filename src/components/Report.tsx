import { topicFindings } from "@/lib/summary";
import type { Feedback } from "@/lib/types";

import type { PanelData } from "./Panel";

/**
 * Only the settled, after-the-fact parts of the panel. Ability, mode,
 * follow-up counters, the depth ceiling and "why this" are live instruments —
 * meaningless once the interview is over, so the report cannot ask for them.
 */
export type ReportPanel = Pick<
  PanelData,
  "topics" | "unjustified" | "comparison" | "explanation"
>;

/**
 * The end-of-interview report. Pure presentation — no hooks, no handlers — so
 * it server-renders on the report page and is still importable by the live
 * screen.
 */
export function Report({
  feedback,
  panel,
  endedEarly = false,
}: {
  feedback: Feedback;
  panel: ReportPanel | null;
  endedEarly?: boolean;
}) {
  const groups: Array<[string, string[]]> = [
    ["Strengths", feedback.strengths],
    ["Gaps", feedback.gaps],
    ["Next", feedback.next],
  ];

  return (
    <div className="bg-paper-raised">
      <div className="mx-auto max-w-[46rem] px-10 py-8">
        <h2 className="font-apparatus text-[10.5px] uppercase tracking-[0.14em] text-graphite-35">
          After the interview
        </h2>

        {endedEarly && (
          <p className="font-apparatus mt-3 max-w-[40rem] border-l border-trace pl-3 text-[11.5px] leading-[1.7] text-graphite-60">
            You ended this session yourself, so it covers only what you had
            reached by then.
          </p>
        )}
        <p className="mt-4 max-w-[34rem] font-question text-[19px] font-light leading-[1.6] text-graphite">
          {feedback.summary}
        </p>

        {/* Knowing it and being able to say it are scored separately on every
            answer, and the summary was blending them. For a tool about
            practising the explaining, that is the useful distinction. */}
        {panel?.explanation && (
          <p className="font-apparatus mt-5 max-w-[40rem] border-l border-rule pl-4 text-[12px] leading-[1.75] text-graphite-60">
            {panel.explanation}
          </p>
        )}

        {/* The comparison the cohort data makes possible: this candidate was
            known before they spoke. Deterministic — no model call. */}
        {panel?.comparison && (
          <section className="mt-7 border-l border-rule pl-4">
            <h3 className="font-apparatus text-[9.5px] uppercase tracking-[0.09em] text-graphite-35">
              Your record, and this hour
            </h3>
            <dl className="mt-2 max-w-[40rem] space-y-1">
              <div className="flex gap-3">
                <dt className="font-apparatus w-[74px] shrink-0 text-[11px] text-graphite-35">record</dt>
                <dd className="font-apparatus text-[11.5px] leading-[1.7] text-graphite-60">
                  {panel.comparison.record}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="font-apparatus w-[74px] shrink-0 text-[11px] text-graphite-35">interview</dt>
                <dd className="font-apparatus text-[11.5px] leading-[1.7] text-graphite-60">
                  {panel.comparison.interview}
                </dd>
              </div>
            </dl>
            <p className="font-apparatus mt-2 max-w-[40rem] text-[11.5px] leading-[1.7] text-graphite">
              {panel.comparison.note}
            </p>
          </section>
        )}

        {/* How far they got, in place of a score. A number would tell them
            which answers were wrong after an interview built so they could
            not infer that. */}
        {panel && panel.topics.length > 0 && (
          <section className="mt-7">
            <h3 className="font-apparatus text-[9.5px] uppercase tracking-[0.09em] text-graphite-35">
              How far you got
            </h3>
            {/* A sentence per area, never a rung name — see topicFindings. */}
            <ul className="mt-3 max-w-[40rem] space-y-3">
              {topicFindings(panel.topics).map((t) => (
                <li key={t.day}>
                  <p className="font-apparatus text-[11.5px] text-graphite">{t.title}</p>
                  <p className="font-apparatus mt-[3px] text-[11.5px] leading-[1.7] text-graphite-60">
                    {t.finding}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Everything they asserted but could not back. Already extracted per
            turn and filtered against their own words, so every line is
            something they actually said. */}
        {panel && panel.unjustified.length > 0 && (
          <section className="mt-7">
            <h3 className="font-apparatus text-[9.5px] uppercase tracking-[0.09em] text-graphite-35">
              Said, but not yet explained
            </h3>
            <ul className="mt-2 space-y-2">
              {panel.unjustified.map((c, i) => (
                <li
                  key={i}
                  className="font-apparatus max-w-[40rem] border-l border-rule pl-3 text-[11.5px] leading-[1.7] text-graphite-60"
                >
                  {c.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        {groups.map(([label, items]) =>
          items.length === 0 ? null : (
            <section key={label} className="mt-7">
              <h3 className="font-apparatus text-[9.5px] uppercase tracking-[0.09em] text-graphite-35">
                {label}
              </h3>
              <ul className="mt-2 space-y-2">
                {items.map((t, i) => (
                  <li
                    key={i}
                    className="font-apparatus max-w-[40rem] text-[11.5px] leading-[1.7] text-graphite-60"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          )
        )}
      </div>
    </div>
  );
}
