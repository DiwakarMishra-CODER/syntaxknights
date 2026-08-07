import candidatesData from "@/data/candidates.json";

import {
  COHORT_DAYS,
  isAttempted,
  isSkipped,
  type Candidate,
  type CandidatesFile,
} from "./types";

/**
 * Statically imported so the data is bundled rather than read from disk —
 * no filesystem access at runtime, so nothing to trace into the Vercel
 * bundle. Immutable reference data, not session state.
 */
const candidates = (candidatesData as unknown as CandidatesFile).candidates;

export function loadCandidates(): Candidate[] {
  return candidates;
}

export function getCandidate(id: string): Candidate | undefined {
  return candidates.find((c) => c.member.id === id);
}

export interface DerivedSignals {
  /** missionsFirstTry / missionsCompleted — 0 when nothing was completed. */
  firstTryRate: number;
  /** commitDays / 31 */
  engagement: number;
  /** missionsCompleted / 31 — from signals, never from missions.length */
  coverage: number;
  skippedDays: number[];
  /** Genuine failures: attempted, passed === false. Not the same as skipped. */
  failedDays: number[];
  /** Passed, but took 3+ attempts. */
  struggledDays: number[];
  /** Passed on the first attempt. */
  cleanDays: number[];
  profileNote: string;
}

export function deriveSignals(candidate: Candidate): DerivedSignals {
  const { missionsCompleted, missionsFirstTry, commitDays } = candidate.signals;

  const firstTryRate =
    missionsCompleted > 0 ? missionsFirstTry / missionsCompleted : 0;
  const engagement = commitDays / COHORT_DAYS;
  const coverage = missionsCompleted / COHORT_DAYS;

  const missions = candidate.missions ?? [];

  const skippedDays = missions.filter(isSkipped).map((m) => m.day);

  const attempted = missions.filter(isAttempted);
  const failedDays = attempted.filter((m) => m.passed === false).map((m) => m.day);
  const struggledDays = attempted
    .filter((m) => m.passed && m.attempts >= 3)
    .map((m) => m.day);
  const cleanDays = attempted
    .filter((m) => m.passed && m.attempts === 1)
    .map((m) => m.day);

  const derived: Omit<DerivedSignals, "profileNote"> = {
    firstTryRate,
    engagement,
    coverage,
    skippedDays,
    failedDays,
    struggledDays,
    cleanDays,
  };

  return { ...derived, profileNote: buildProfileNote(candidate, derived) };
}

/** One short line describing the SHAPE of this candidate, for the planner. */
function buildProfileNote(
  candidate: Candidate,
  d: Omit<DerivedSignals, "profileNote">
): string {
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const { jobRole, yearsExperience } = candidate.member;

  let note: string;

  if (d.coverage >= 0.9 && d.firstTryRate <= 0.35) {
    note = `Finished nearly everything (${pct(d.coverage)}) but only ${pct(
      d.firstTryRate
    )} first try — high persistence, lots of rework; probe depth rather than breadth.`;
  } else if (d.firstTryRate >= 0.99 && d.coverage >= 0.8) {
    note = `Clean run — ${pct(
      d.coverage
    )} coverage, every completed mission passed first try; push hard on trade-offs and edge cases.`;
  } else if (d.engagement < 0.55 && d.skippedDays.length >= 2) {
    note = `Low engagement (${pct(d.engagement)} of days had commits) with ${
      d.skippedDays.length
    } skipped missions — coverage is patchy; anchor on what they actually finished.`;
  } else if (d.failedDays.length > 0) {
    note = `${d.failedDays.length} mission${
      d.failedDays.length === 1 ? "" : "s"
    } attempted and failed (days ${d.failedDays.join(
      ", "
    )}) — worth asking what blocked them, not whether they finished.`;
  } else if (d.struggledDays.length >= 3) {
    note = `Got there in the end on most things but needed 3+ attempts on ${d.struggledDays.length} missions — steady grinder, check the understanding stuck.`;
  } else {
    note = `${pct(d.coverage)} coverage, ${pct(
      d.firstTryRate
    )} first-try rate, commits on ${pct(d.engagement)} of days — an even profile.`;
  }

  // yearsExperience is prior career experience, not cohort performance —
  // a large gap in either direction is worth flagging to the planner.
  const experienced = yearsExperience >= 5;
  const strong = d.firstTryRate >= 0.7;

  if (experienced && !strong) {
    note += ` Mismatch worth noting: ${yearsExperience}y as a ${jobRole}, but only ${pct(
      d.firstTryRate
    )} first try — likely new to this stack rather than new to engineering.`;
  } else if (!experienced && strong) {
    note += ` Outperforming their background (${yearsExperience}y as a ${jobRole}).`;
  }

  return note;
}
