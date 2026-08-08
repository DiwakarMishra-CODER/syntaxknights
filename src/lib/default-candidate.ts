import { getCandidate, loadCandidates } from "./signals";

/**
 * Who the interview is for when nobody said.
 *
 * One constant instead of the id being retyped at each entry point — the
 * previous version had it inlined in the interview page, so "switch student"
 * meant editing a JSX literal.
 */
export const DEFAULT_CANDIDATE_ID = "CAND-017";

/**
 * Resolves a candidate id from untrusted input (a query string).
 *
 * Returns null rather than a fallback for an unknown id: silently starting a
 * different person's interview because a link had a typo would plan against
 * the wrong 31-day record and produce feedback addressed to the wrong name.
 */
export function resolveCandidateId(raw: string | undefined | null): string | null {
  if (!raw) return null;
  return getCandidate(raw) ? raw : null;
}

/** Every candidate the app can interview, in id order. */
export function candidateRoster() {
  return [...loadCandidates()].sort((a, b) => a.member.id.localeCompare(b.member.id));
}
