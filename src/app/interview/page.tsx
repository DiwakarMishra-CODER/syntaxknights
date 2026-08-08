import { InterviewScreen } from "@/components/InterviewScreen";

export const metadata = {
  title: "Practice interview — MockMate",
  description: "An adaptive practice technical interview for cohort graduates.",
};

export default async function InterviewPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await props.searchParams;
  const candidateId =
    typeof resolvedSearchParams?.candidateId === "string"
      ? resolvedSearchParams.candidateId
      : "CAND-017";
  return <InterviewScreen candidateId={candidateId} />;
}
