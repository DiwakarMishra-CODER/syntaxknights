import { InterviewScreen } from "@/components/InterviewScreen";

export const metadata = {
  title: "Practice interview — MockMate",
  description: "An adaptive practice technical interview for cohort graduates.",
};

export default function InterviewPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const candidateId = typeof searchParams.candidateId === "string" ? searchParams.candidateId : "CAND-017";
  return <InterviewScreen candidateId={candidateId} />;
}
