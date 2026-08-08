import Link from "next/link";

import { candidateRoster } from "@/lib/default-candidate";
import { deriveSignals } from "@/lib/signals";

/**
 * Who to interview.
 *
 * A server component: the roster is a static JSON file read server-side, so
 * there is nothing to fetch and no loading state. Every row links to
 * /interview?candidate=<id>, which mints a fresh session for that person.
 *
 * The record shown here is the same derivation the planner uses, so what you
 * pick from is what the interview will actually be planned against — no
 * separate summary to drift out of sync.
 */

export const metadata = {
  title: "Choose a graduate — MockMate",
  description: "Pick which cohort graduate to interview.",
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function CandidatesPage() {
  const roster = candidateRoster();

  return (
    <main className="interview-root min-h-screen bg-paper">
      <div className="mx-auto max-w-[52rem] px-10 pb-6 pt-10">
        <Link
          href="/"
          className="font-apparatus text-[10.5px] uppercase tracking-[0.12em] text-graphite-35 transition-colors hover:text-graphite"
        >
          ← MockMate
        </Link>
      </div>

      <div className="border-t border-rule bg-paper-raised">
        <div className="mx-auto max-w-[52rem] px-10 py-8">
          <h1 className="font-apparatus text-[10.5px] uppercase tracking-[0.14em] text-graphite-35">
            Choose a graduate
          </h1>
          <p className="mt-4 max-w-[34rem] font-question text-[19px] font-light leading-[1.6] text-graphite">
            Each of these people worked through the same 31-day build. The
            interview is planned from their record, so no two run the same way.
          </p>

          <ul className="mt-8 border-t border-rule">
            {roster.map((c) => {
              const s = deriveSignals(c);
              const notes = [
                `${pct(s.coverage)} completed`,
                `${pct(s.firstTryRate)} first try`,
              ];
              if (s.struggledDays.length) notes.push(`${s.struggledDays.length} took 3+ attempts`);
              if (s.failedDays.length) notes.push(`${s.failedDays.length} never passed`);
              if (s.skippedDays.length) notes.push(`${s.skippedDays.length} skipped`);

              return (
                <li key={c.member.id} className="border-b border-rule">
                  <Link
                    href={`/interview?candidate=${c.member.id}`}
                    className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-4 transition-colors hover:bg-paper"
                  >
                    <div className="min-w-0">
                      <span className="font-apparatus text-[13px] text-graphite group-hover:underline">
                        {c.member.name}
                      </span>
                      <span className="font-apparatus ml-2 text-[11px] text-graphite-35">
                        {c.member.id}
                      </span>
                      <p className="font-apparatus mt-1 text-[11px] leading-[1.7] text-graphite-60">
                        {c.member.jobRole} · {c.member.yearsExperience}y
                      </p>
                    </div>
                    <p className="font-apparatus text-right text-[11px] leading-[1.7] text-graphite-60">
                      {notes.join(" · ")}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
