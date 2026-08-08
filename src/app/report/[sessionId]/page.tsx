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
    <main className="min-h-screen bg-slate-50 dark:bg-[#050806] text-slate-900 dark:text-[#F5F7F4] font-sans transition-colors duration-300">
      {/* Ambient glows visible in dark mode */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#1FD16A]/0 dark:bg-[#1FD16A]/6 blur-[180px] rounded-full transition-opacity duration-500" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#73F0A0]/0 dark:bg-[#73F0A0]/3 blur-[140px] rounded-full transition-opacity duration-500" />
      </div>
      {/* Header nav */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/5 bg-white/70 dark:bg-[#080D0A]/80 backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-[#1FD16A]/10 border border-emerald-200 dark:border-[#1FD16A]/30 flex items-center justify-center text-emerald-600 dark:text-[#1FD16A] font-mono font-bold text-sm">
              M
            </div>
            <span className="font-sans font-bold text-sm text-slate-900 dark:text-white tracking-tight">MockMate</span>
          </Link>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-[#7E8B84]">Interview Report</span>
        </div>
      </header>
      {children}
    </main>
  );
}

function Notice({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 py-20 flex flex-col items-center text-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#1FD16A]/10 border border-emerald-200 dark:border-[#1FD16A]/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-emerald-600 dark:text-[#1FD16A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-[#8B968F] max-w-md leading-relaxed">{body}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

const linkStyle =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-sans font-semibold bg-emerald-500 dark:bg-[#1FD16A] text-white dark:text-[#050806] hover:bg-emerald-400 dark:hover:bg-[#73F0A0] shadow-md transition-all";

const secondaryLinkStyle =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-sans font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-[#C5D0C8] hover:border-emerald-400 dark:hover:border-[#1FD16A]/40 hover:text-emerald-600 dark:hover:text-white transition-all";

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
      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 py-8 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center gap-4">
        <Link
          href={`/interview?candidate=${session.candidate.member.id}`}
          className={linkStyle}
        >
          Practice Again →
        </Link>
        <Link
          href="/dashboard"
          className={secondaryLinkStyle}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </Shell>
  );
}
