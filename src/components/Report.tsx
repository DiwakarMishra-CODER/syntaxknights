import { topicFindings } from "@/lib/summary";
import type { Feedback } from "@/lib/types";
import type { PanelData } from "./Panel";

export type ReportPanel = Pick<
  PanelData,
  "topics" | "unjustified" | "comparison" | "explanation"
>;

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
}

export function Report({
  feedback,
  panel,
  endedEarly = false,
}: {
  feedback: Feedback;
  panel: ReportPanel | null;
  endedEarly?: boolean;
}) {
  const hasStrengths = feedback.strengths.length > 0;
  const hasGaps = feedback.gaps.length > 0;
  const hasNext = feedback.next.length > 0;
  const hasTopics = panel && panel.topics.length > 0;
  const hasUnjustified = panel && panel.unjustified.length > 0;

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 py-14 space-y-10">

      {/* Header */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-emerald-50 dark:bg-[#1FD16A]/10 text-emerald-700 dark:text-[#1FD16A] border border-emerald-200 dark:border-[#1FD16A]/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#1FD16A]" />
          Session Complete
        </div>

        {endedEarly && (
          <p className="text-xs font-mono text-slate-500 dark:text-[#8B968F] border-l-2 border-emerald-300 dark:border-[#1FD16A]/30 pl-3">
            You ended this session early — feedback covers only what was reached.
          </p>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
          Interview Report
        </h1>

        {feedback.summary && (
          <p className="text-base sm:text-lg text-slate-600 dark:text-[#C5D0C8] leading-relaxed max-w-2xl">
            {feedback.summary}
          </p>
        )}

        {panel?.explanation && (
          <p className="text-sm text-slate-500 dark:text-[#8B968F] border-l-2 border-slate-200 dark:border-white/10 pl-3 leading-relaxed max-w-2xl">
            {panel.explanation}
          </p>
        )}
      </header>

      {/* Divider */}
      <div className="h-px bg-slate-200 dark:bg-white/5" />

      {/* Strong Points & Weak Points side by side */}
      {(hasStrengths || hasGaps) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Strong Points — teal/emerald */}
          {hasStrengths && (
            <div className="p-6 rounded-2xl border border-teal-200 dark:border-teal-500/20 bg-teal-50/60 dark:bg-teal-950/30 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-500/15 border border-teal-300 dark:border-teal-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-400">
                  Strong Points
                </h2>
              </div>
              <ul className="space-y-3">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700 dark:text-[#C5D0C8]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weak Points — rose/red */}
          {hasGaps && (
            <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/60 dark:bg-rose-950/30 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-rose-700 dark:text-rose-400">
                  Weak Points
                </h2>
              </div>
              <ul className="space-y-3">
                {feedback.gaps.map((g, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700 dark:text-[#C5D0C8]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 shrink-0" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Topics Coverage — violet/indigo */}
      {hasTopics && (
        <section className="p-6 rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-violet-50/60 dark:bg-violet-950/30 backdrop-blur-sm space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-500/15 border border-violet-300 dark:border-violet-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
            <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-400">
              Topics Coverage
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {topicFindings(panel!.topics).map((t) => (
              <div key={t.day} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-900 dark:text-white font-semibold truncate pr-2">{t.title}</span>
                  <span className="text-slate-400 dark:text-[#7E8B84] shrink-0">Day {t.day}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#8B968F] leading-relaxed">{t.finding}</p>
                <ScoreBar pct={Math.min(100, (t.day / 31) * 100)} color="#8B5CF6" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Said But Not Explained — amber/orange */}
      {hasUnjustified && (
        <section className="p-6 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-950/30 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Said, Not Yet Justified
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#8B968F]">Claims you made that could benefit from deeper explanation:</p>
          <ul className="space-y-2">
            {panel!.unjustified.map((c, i) => (
              <li key={i} className="text-sm text-slate-700 dark:text-[#C5D0C8] border-l-2 border-amber-400 dark:border-amber-500/50 pl-3 leading-relaxed">
                {c.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Record vs Session — sky/cyan */}
      {panel?.comparison && (
        <section className="p-6 rounded-2xl border border-sky-200 dark:border-sky-500/20 bg-sky-50/60 dark:bg-sky-950/30 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-400">
              Your Record vs. This Session
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-[#7E8B84]">Commit Record</p>
              <p className="text-sm text-slate-700 dark:text-[#C5D0C8] leading-relaxed">{panel.comparison.record}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-[#7E8B84]">Interview Performance</p>
              <p className="text-sm text-slate-700 dark:text-[#C5D0C8] leading-relaxed">{panel.comparison.interview}</p>
            </div>
          </div>
          {panel.comparison.note && (
            <p className="text-xs text-slate-500 dark:text-[#8B968F] border-t border-sky-200 dark:border-white/5 pt-3 leading-relaxed">
              {panel.comparison.note}
            </p>
          )}
        </section>
      )}

      {/* Suggestions & Next Steps — emerald green */}
      {hasNext && (
        <section className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/30 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Suggestions &amp; Next Steps
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {feedback.next.map((t, i) => (
              <div key={i} className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/15 bg-emerald-100/50 dark:bg-emerald-500/[0.06] space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">0{i + 1}</span>
                <p className="text-sm text-slate-700 dark:text-[#C5D0C8] leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
