import { redirect } from "next/navigation";

import { DEFAULT_CANDIDATE_ID, resolveCandidateId } from "@/lib/default-candidate";

/**
 * Mints a session id server-side and redirects, so the id lives in the URL.
 *
 * It used to be minted client-side from Date.now(), which meant it existed
 * nowhere else: any navigation destroyed it, a refresh started over, and two
 * tabs opened in the same millisecond shared a session.
 *
 * `?candidate=CAND-003` picks who is being interviewed and is carried into
 * the minted URL. An unknown id falls back to the default rather than
 * creating a session for a person who does not exist.
 */
export const dynamic = "force-dynamic";

export default async function NewInterview({
  searchParams,
}: {
  searchParams: Promise<{ candidate?: string; candidateId?: string }>;
}) {
  // Both spellings. The landing page's "Start practice" CTA links with
  // `candidateId`; this route was written with `candidate`. Accepting both
  // keeps their components untouched.
  const { candidate, candidateId } = await searchParams;
  const id = resolveCandidateId(candidate ?? candidateId) ?? DEFAULT_CANDIDATE_ID;

  redirect(`/interview/ui-${crypto.randomUUID()}?candidate=${id}`);
}
