import { topicFindings } from "@/lib/summary";
import {
  assessmentCriteria,
  calculatePerformance,
  extractQAPairs,
  rung,
} from "@/lib/report-view";
import type { Candidate, Feedback, FocusDay, Turn } from "@/lib/types";
import type { ReportPanel } from "./Report";

/**
 * The printable report.
 *
 * A separate component rather than a print stylesheet over Report.tsx,
 * because Report.tsx *unmounts* its inactive tabs and collapsed answers —
 * `@media print` there would capture only whichever tab happened to be open.
 * This renders every section in one flow, in document order.
 *
 * Deliberately plain: no framer-motion (its inline `opacity: 0` survives into
 * the print snapshot), no glass/blur, no dark-mode variants. Colours are
 * fixed light values, because the app defaults to dark and paper is white.
 * Every number comes from lib/report-view, shared with the on-screen report,
 * so the two cannot disagree.
 *
 * Server component — no "use client", nothing interactive.
 */

function Bar({ pct }: { pct: number }) {
  return (
    <div className="pr-bar">
      <div className="pr-bar-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pr-section">
      <h2 className="pr-h2">{title}</h2>
      {children}
    </section>
  );
}

export function ReportPrint({
  feedback,
  panel,
  turns = [],
  focusDays = [],
  candidate,
  endedEarly = false,
  sessionId,
  generatedOn,
}: {
  feedback: Feedback;
  panel: ReportPanel | null;
  turns?: Turn[];
  focusDays?: FocusDay[];
  candidate?: Candidate;
  endedEarly?: boolean;
  sessionId: string;
  /** Passed in, never computed here — a server component that calls Date.now()
   *  re-renders differently on every request and defeats caching. */
  generatedOn: string;
}) {
  const qaPairs = extractQAPairs(turns, focusDays);
  const perf = calculatePerformance(turns);
  const criteria = assessmentCriteria(turns, focusDays);
  const topics = panel?.topics.length ? topicFindings(panel.topics) : [];
  const unjustified = panel?.unjustified ?? [];

  return (
    <article className="pr-root">
      <header className="pr-header">
        <div>
          <p className="pr-eyebrow">MockMate — Interview Practice Report</p>
          <h1 className="pr-h1">{candidate?.member.name ?? "Candidate"}</h1>
          <p className="pr-meta">
            {candidate?.member.jobRole}
            {candidate?.member.jobRole && " · "}
            {qaPairs.length} question{qaPairs.length === 1 ? "" : "s"} · {generatedOn}
          </p>
        </div>
        {perf && (
          <div className="pr-score">
            <div className="pr-score-pct">{perf.pct}%</div>
            <div className="pr-score-grade">{perf.grade}</div>
          </div>
        )}
      </header>

      {endedEarly && (
        <p className="pr-note">
          This session was ended early, so it covers only part of the planned interview.
        </p>
      )}

      <Section title="Summary">
        <p className="pr-body">{feedback.summary}</p>
      </Section>

      {criteria && (
        <Section title="Assessment">
          <p className="pr-sub">
            Averaged over {criteria.scoredCount} scored answer
            {criteria.scoredCount === 1 ? "" : "s"}.
          </p>
          <div className="pr-criteria">
            {[
              ["Technical Authority", criteria.knowledgePct, rung(criteria.knowledge)],
              ["Build Evidence", criteria.specificityPct, rung(criteria.specificity)],
              ["Clear Explanation", criteria.communicationPct, rung(criteria.communication)],
              [
                "Objectives Covered",
                criteria.objectivesPct,
                `${criteria.objectivesHit}/${criteria.objectivesPlanned}`,
              ],
            ].map(([label, pct, detail]) => (
              <div key={String(label)} className="pr-criterion">
                <div className="pr-row">
                  <span>{label}</span>
                  <span className="pr-mono">{detail}</span>
                </div>
                <Bar pct={Number(pct)} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Empty is a real answer — see reporter.ts. No section rather than a
          consolation line. */}
      {feedback.strengths.length > 0 && (
        <Section title="What You Explained Well">
          <ul className="pr-list">
            {feedback.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>
      )}

      {feedback.gaps.length > 0 && (
        <Section title="Where It Thinned Out">
          <ul className="pr-list">
            {feedback.gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </Section>
      )}

      {panel?.explanation && (
        <Section title="Knowing It vs Explaining It">
          <p className="pr-body">{panel.explanation}</p>
        </Section>
      )}

      {topics.length > 0 && (
        <Section title="Topics Covered">
          <table className="pr-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>What was asked</th>
                <th className="pr-right">Your answers</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t.day}>
                  <td className="pr-strong">{t.title}</td>
                  <td>{t.finding}</td>
                  <td className="pr-right pr-mono">
                    {t.level ?? "Not scored"}
                    {t.knowledgeAvg !== null && ` (${rung(t.knowledgeAvg)})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {unjustified.length > 0 && (
        <Section title="Said, But Not Backed Up">
          <p className="pr-sub">
            Asserted without detail an interviewer could check. Be ready to show the code.
          </p>
          <ul className="pr-list">
            {unjustified.map((c, i) => (
              <li key={i}>{c.text}</li>
            ))}
          </ul>
        </Section>
      )}

      {panel?.comparison && (
        <Section title="Cohort Record vs This Interview">
          <p className="pr-body">
            <strong>Record:</strong> {panel.comparison.record}
          </p>
          <p className="pr-body">
            <strong>This interview:</strong> {panel.comparison.interview}
          </p>
          <p className="pr-body">{panel.comparison.note}</p>
        </Section>
      )}

      {feedback.next.length > 0 && (
        <Section title="What To Do Next">
          <ol className="pr-list">
            {feedback.next.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ol>
        </Section>
      )}

      {qaPairs.length > 0 && (
        <Section title="Full Transcript">
          {qaPairs.map((qa) => {
            const k = qa.rubric?.knowledge ?? null;
            return (
              <div key={qa.turnNumber} className="pr-qa">
                <div className="pr-row">
                  <span className="pr-strong">
                    Q{qa.turnNumber} · {qa.topicTitle}
                  </span>
                  <span className="pr-mono">
                    {qa.rubric
                      ? `knowledge ${qa.rubric.knowledge}/5 · communication ${qa.rubric.communication}/5 · specificity ${qa.rubric.specificity}/5`
                      : "not scored"}
                    {k !== null && qa.depth !== null && ` · asked at ${qa.depth}/5`}
                  </span>
                </div>
                <p className="pr-q">{qa.question}</p>
                <p className="pr-a">{qa.answer}</p>
                {qa.rationale && <p className="pr-why">Why this was asked: {qa.rationale}</p>}
              </div>
            );
          })}
        </Section>
      )}

      <footer className="pr-footer">
        MockMate practice report · session {sessionId.slice(0, 18)} · This is a
        learning tool, not a hiring assessment.
      </footer>
    </article>
  );
}
