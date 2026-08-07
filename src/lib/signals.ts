import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  COHORT_DAYS,
  isAttempted,
  isSkipped,
  type Candidate,
  type CandidatesFile,
} from "./types";

const CANDIDATES_PATH = join(process.cwd(), "data", "candidates.json");

/** Immutable static data — see the note in curriculum.ts. */
let cached: Candidate[] | null = null;

export function loadCandidates(): Candidate[] {
  if (cached) return cached;

  let raw: string;
  try {
    raw = readFileSync(CANDIDATES_PATH, "utf8");
  } catch {
    throw new Error(
      `Could not read ${CANDIDATES_PATH}. Drop candidates.json into /data.`
    );
  }

  const parsed = JSON.parse(raw) as CandidatesFile;
  if (!Array.isArray(parsed?.candidates)) {
    throw new Error("candidates.json: expected { candidates: [...] }");
  }

  cached = parsed.candidates;
  return cached;
}

/**
 * The exact key holding the candidate code ("CAND-018") is read defensively:
 * the id may live on `member.id`, `member.memberId`, or `member.code`
 * depending on the export. One place to fix if the real file differs.
 */
export function candidateId(c: Candidate): string {
  const m = c.member as unknown as Record<string, unknown>;
  for (const key of ["id", "memberId", "member_id", "code", "candidateId"]) {
    const v = m?.[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

export function candidateName(c: Candidate): string {
  const m = c.member as unknown as Record<string, unknown>;
  for (const key of ["name", "fullName", "full_name"]) {
    const v = m?.[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

/** Prior experience, if the file records it in any of the usual shapes. */
export function candidateExperience(c: Candidate): string | null {
  const m = c.member as unknown as Record<string, unknown>;
  for (const key of [
    "experience",
    "experienceLevel",
    "background",
    "yearsExperience",
    "seniority",
  ]) {
    const v = m?.[key];
    if (typeof v === "string" && v.length > 0) return v;
    if (typeof v === "number") return `${v}`;
  }
  return null;
}

export function getCandidate(id: string): Candidate | undefined {
  return loadCandidates().find((c) => candidateId(c) === id);
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
  const experience = candidateExperience(candidate);

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

  if (experience) {
    const strong = d.firstTryRate >= 0.7;
    const looksSenior = /senior|lead|\b([5-9]|\d{2})\+?\s*(y|year)/i.test(
      experience
    );
    if (looksSenior && !strong) {
      note += ` Note the mismatch: stated experience "${experience}" vs a ${pct(
        d.firstTryRate
      )} first-try rate.`;
    } else if (!looksSenior && strong) {
      note += ` Outperforming their stated experience ("${experience}").`;
    }
  }

  return note;
}
