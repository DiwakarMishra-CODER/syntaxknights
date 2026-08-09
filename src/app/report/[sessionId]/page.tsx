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

export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#050806] text-[#F5F7F4] font-sans">
      {/* Ambient background glows matching landing page theme */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#1FD16A] opacity-[0.05] mix-blend-screen blur-[180px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#1FD16A] opacity-[0.03] mix-blend-screen blur-[140px] rounded-full" />
      </div>

      {/* Header nav matching landing page theme */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#080D0A]/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-[#1FD16A]/10 border border-[#1FD16A]/30 flex items-center justify-center text-[#1FD16A] font-bold text-sm shadow-[0_0_15px_rgba(31,209,106,0.15)] group-hover:scale-105 transition-all">
              M
            </div>
            <span className="font-bold text-base text-white tracking-tight">
              MockMate
            </span>
          </Link>
          <span className="text-xs font-mono uppercase tracking-widest text-[#1FD16A] px-3 py-1 rounded-full bg-[#1FD16A]/10 border border-[#1FD16A]/20">
            Interview Performance Report
          </span>
        </div>
      </header>

      {children}
    </main>
  );
}

function Notice({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 py-20 flex flex-col items-center text-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-[#1FD16A]/10 border border-[#1FD16A]/20 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-[#1FD16A]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-[#8B968F] max-w-md leading-relaxed">
          {body}
        </p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

const linkStyle =
  "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#1FD16A] text-black hover:bg-[#1FD16A]/90 shadow-[0_0_15px_rgba(31,209,106,0.3)] transition-all cursor-pointer";

const secondaryLinkStyle =
  "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider border border-white/10 bg-white/5 text-[#C5D0C8] hover:border-white/20 hover:text-white transition-all cursor-pointer";

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
          title="This interview is still in progress."
          body="Your comprehensive report and full Q&A breakdown will be available once the session concludes."
          action={
            <Link href={`/interview/${sessionId}`} className={linkStyle}>
              Resume Practice Session →
            </Link>
          }
        />
      </Shell>
    );
  }

  const feedback = await loadReport(sessionId);
  if (!feedback) {
    return (
      <Shell>
        <Notice
          title="Writing your report..."
          body="Your interview is stored. We are generating your full technical report and performance analytics. Please refresh in a few seconds."
        />
      </Shell>
    );
  }

  const turns = await getRecentTurns(sessionId, 400);
  const signals = deriveSignals(session.candidate);
  const focusDays = session.blueprint?.focusDays ?? [];
  const topics = topicsReached(turns, focusDays);

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
      <Report
        feedback={feedback}
        panel={panel}
        turns={turns}
        focusDays={focusDays}
        candidate={session.candidate}
        endedEarly={session.state.endedEarly}
      />
      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-10 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/interview?candidate=${session.candidate.member.id}`}
            className={linkStyle}
          >
            Practice Again →
          </Link>
          <Link href="/dashboard" className={secondaryLinkStyle}>
            ← Back to Dashboard
          </Link>
        </div>
        <p className="text-xs text-[#7E8B84] font-mono">
          Session ID: {sessionId.slice(0, 18)}...
        </p>
      </div>
    </Shell>
  );
}
