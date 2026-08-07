/**
 * Shared types for the curriculum and candidate data files, plus the
 * public API contract. See CLAUDE.md for the contract — it is fixed.
 */

/** The cohort runs for exactly 31 days. Every rate is expressed against this. */
export const COHORT_DAYS = 31;

// ---------------------------------------------------------------------------
// Curriculum
// ---------------------------------------------------------------------------

export const DAY_TYPES = [
  "SETUP",
  "BUILD",
  "LEARN",
  "AI_CORE",
  "SHIP_IT",
  "OPTIMIZE",
  "CAPSTONE",
] as const;

export type DayType = (typeof DAY_TYPES)[number];

export interface CurriculumDay {
  day: number;
  title: string;
  type: DayType;
  tools: string[];
  objectives: string[];
}

/**
 * `days` is an inclusive [start, end] PAIR, not an enumeration of every day
 * in the module. Expand it with moduleDayNumbers() — never iterate it.
 */
export interface CurriculumModule {
  /** Module number, 1-8. */
  n: number;
  title: string;
  days: [number, number];
}

export interface Curriculum {
  /** A display string, e.g. "AI Cohort · 31 days · 8 modules". */
  cohort: string;
  modules: CurriculumModule[];
  days: CurriculumDay[];
}

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------

/**
 * A mission the candidate never started. Has NO `attempts` and NO `passed`.
 * The discriminated union below makes reading either one a compile error.
 */
export interface SkippedMission {
  day: number;
  title: string;
  skipped: true;
}

/** A mission the candidate actually attempted. `passed: false` is a real failure. */
export interface AttemptedMission {
  day: number;
  title: string;
  skipped?: false;
  attempts: number;
  passed: boolean;
}

export type Mission = SkippedMission | AttemptedMission;

export function isSkipped(m: Mission): m is SkippedMission {
  return m.skipped === true;
}

export function isAttempted(m: Mission): m is AttemptedMission {
  return m.skipped !== true;
}

/**
 * `status` is "COMPLETED" for all 20 candidates and carries no information.
 * Never branch on it.
 */
export interface CandidateMember {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: "COMPLETED";
}

/**
 * The authoritative counts. `missionsCompleted` is the real total and may be
 * 30 while `missions.length` is 10 — never compute completion from the array.
 */
export interface CandidateSignals {
  missionsCompleted: number;
  missionsFirstTry: number;
  commitDays: number;
}

export interface Candidate {
  member: CandidateMember;
  /** A SUBSET (~10) of the 31 days, not the full record. */
  missions: Mission[];
  signals: CandidateSignals;
}

export interface CandidatesFile {
  candidates: Candidate[];
}

// ---------------------------------------------------------------------------
// Session state, turns, claims
// ---------------------------------------------------------------------------

/** One thing the candidate asserted, tracked so later turns can probe it. */
export interface Claim {
  day: number;
  text: string;
  /** True when they asserted it without supporting detail — worth probing. */
  unjustified?: boolean;
  status?: "asserted" | "probed" | "verified" | "contradicted";
}

export interface RubricScore {
  [dimension: string]: number;
}

export type TurnRole = "interviewer" | "candidate";

export interface Turn {
  turnNumber: number;
  role: TurnRole;
  content: string;
  targetDay: number | null;
  depth: number | null;
  rubric: RubricScore | null;
  claims: Claim[];
  rationale: string | null;
}

export type FocusStrategy =
  | "verify_depth"
  | "probe_gap"
  | "rebuild_confidence"
  | "pressure_test";

export const FOCUS_STRATEGIES: FocusStrategy[] = [
  "verify_depth",
  "probe_gap",
  "rebuild_confidence",
  "pressure_test",
];

export interface FocusDay {
  day: number;
  title: string;
  /** Why THIS candidate — must reference their actual record. */
  reason: string;
  /** 1-5. */
  startDepth: number;
  strategy: FocusStrategy;
}

/** How many questions to spend in each phase. Sums to targetQuestions. */
export interface InterviewArc {
  warmup: number;
  build: number;
  stress: number;
  land: number;
}

/** The planner's one-time interview plan, produced once per session. */
export interface Blueprint {
  persona: string;
  openingLine: string;
  /** 8-12. */
  targetQuestions: number;
  arc: InterviewArc;
  /** 4-6 days, never SETUP. */
  focusDays: FocusDay[];
}

/** Mutable per-session state. Lives in Supabase only — never in memory. */
export interface SessionState {
  turnNumber: number;
  currentDay: number | null;
  depth: number;
  [key: string]: unknown;
}

export type SessionStatus = "active" | "done";

export interface Session {
  id: string;
  candidate: Candidate;
  blueprint: Blueprint | null;
  state: SessionState;
  status: SessionStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// API contract (CLAUDE.md — do not add fields)
// ---------------------------------------------------------------------------

export interface Feedback {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

export type InterviewResponse =
  | { reply: string; done: false }
  | { reply: string; done: true; feedback: Feedback };
