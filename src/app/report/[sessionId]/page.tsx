import Link from "next/link";
import { notFound } from "next/navigation";

import { Report, type ReportPanel } from "@/components/Report";
import { getRecentTurns, loadReport, loadSession } from "@/lib/db";
import { deriveSignals } from "@/lib/signals";
import {
  compareToRecord,
  explanationSignal,
  topicsReached,
  unjustifiedClaims,
} from "@/lib/summary";

/**
 * The report, on its own URL.
 *
 * A server component on purpose: db.ts holds the service-role key and is
 * server-only, so this reads Postgres directly — no HTTP hop, no loading
 * state, no client-side error path. It also makes the result linkable: a
 * shared URL and the candidate's own browser render identical bytes, because
 * both read the same stored row rather than regenerating anything.
 *
 * Nothing here calls the model. A refresh costs zero quota.
 */

export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="interview-root min-h-screen bg-paper">
      <div className="mx-auto max-w-[46rem] px-10 pb-6 pt-10">
        <Link
          href="/"
          className="font-apparatus text-[10.5px] uppercase tracking-[0.12em] text-graphite-35 transition-colors hover:text-graphite"
        >
          ← MockMate
        </Link>
      </div>
      {children}
    </main>
  );
}

function Notice({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="border-t border-rule bg-paper-raised">
      <div className="mx-auto max-w-[46rem] px-10 py-10">
        <h1 className="font-question text-[19px] font-light leading-[1.6] text-graphite">{title}</h1>
        <p className="font-apparatus mt-3 max-w-[34rem] text-[11.5px] leading-[1.7] text-graphite-60">
          {body}
        </p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

const linkStyle =
  "font-apparatus border border-graphite px-4 py-[7px] text-[10.5px] uppercase tracking-[0.12em] text-graphite transition-colors hover:bg-graphite hover:text-paper";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const session = await loadSession(sessionId);
  if (!session) notFound();

  if (session.status !== "done") {
    return (
      <Shell>
        <Notice
          title="This interview is still open."
          body="Your report is written once the interview ends — either when it reaches its natural close, or when you end it yourself."
          action={
            <Link href={`/interview/${sessionId}`} className={linkStyle}>
              Back to the interview →
            </Link>
          }
        />
      </Shell>
    );
  }

  const feedback = await loadReport(sessionId);
  if (!feedback) {
    // The window between markDone and saveReport, or a reporter that failed
    // to persist. The interview itself is safe — every turn is already stored.
    return (
      <Shell>
        <Notice
          title="Your report is still being written."
          body="This takes about twenty seconds. Refresh this page in a moment — nothing from your interview is lost."
        />
      </Shell>
    );
  }

  // The same derivation the live panel uses, so the report reads identically
  // whether it arrived here from the End button or from a shared link.
  const turns = await getRecentTurns(sessionId, 400);
  const signals = deriveSignals(session.candidate);
  const topics = topicsReached(turns, session.blueprint?.focusDays ?? []);

  // Every scored answer already carries knowledge and communication.
  const rubrics = turns
    .map((t) => t.rubric)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const panel: ReportPanel = {
    topics,
    explanation: explanationSignal(rubrics),
    unjustified: unjustifiedClaims(turns.flatMap((t) => t.claims ?? [])),
    comparison: compareToRecord({
      firstTryRate: signals.firstTryRate,
      coverage: signals.coverage,
      missionsCompleted: session.candidate.signals.missionsCompleted,
      missionsFirstTry: session.candidate.signals.missionsFirstTry,
      skippedDays: signals.skippedDays,
      failedDays: signals.failedDays,
      struggledDays: signals.struggledDays,
      abilityEstimate: session.state.abilityEstimate,
      topics,
    }),
  };

  return (
    <Shell>
      <Report feedback={feedback} panel={panel} endedEarly={session.state.endedEarly} />
      <div className="mx-auto flex max-w-[46rem] flex-wrap items-center gap-4 px-10 py-8">
        {/* Carries the candidate, so "again" means the same person against a
            freshly planned interview rather than silently the default one. */}
        <Link
          href={`/interview?candidate=${session.candidate.member.id}`}
          className={linkStyle}
        >
          Practice again →
        </Link>
        <Link
          href="/dashboard"
          className="font-apparatus text-[10.5px] uppercase tracking-[0.12em] text-graphite-35 underline underline-offset-4 transition-colors hover:text-graphite"
        >
          Interview someone else
        </Link>
      </div>
    </Shell>
  );
}
