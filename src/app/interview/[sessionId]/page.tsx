import { InterviewScreen } from "@/components/InterviewScreen";
import { loadSession } from "@/lib/db";
import { DEFAULT_CANDIDATE_ID, resolveCandidateId } from "@/lib/default-candidate";
import { getCandidate } from "@/lib/signals";

export const metadata = {
  title: "Practice interview — MockMate",
  description: "An adaptive practice technical interview for cohort graduates.",
};

export const dynamic = "force-dynamic";

export default async function InterviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ candidate?: string; candidateId?: string }>;
}) {
  const [{ sessionId }, { candidate, candidateId: fromModal }] = await Promise.all([
    params,
    searchParams,
  ]);

  // The STORED candidate wins. Once a session exists its blueprint, claim
  // ledger and report all belong to one person; letting a hand-edited query
  // string swap them mid-interview would plan against one 31-day record and
  // report against another. The query string only seeds a session that does
  // not exist yet.
  const existing = await loadSession(sessionId);
  const candidateId =
    existing?.candidate.member.id ??
    resolveCandidateId(candidate ?? fromModal) ??
    DEFAULT_CANDIDATE_ID;

  const name = getCandidate(candidateId)?.member.name ?? candidateId;

  return (
    <InterviewScreen
      sessionId={sessionId}
      candidateId={candidateId}
      candidateName={name}
    />
  );
}
