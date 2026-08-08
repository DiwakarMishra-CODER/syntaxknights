import CandidatesView from "@/components/dashboard/CandidatesView";
import candidatesData from "../../../data/candidates.json";

export const metadata = {
  title: "All Candidates — MockMate",
  description: "View all candidates in the cohort.",
};

export default function CandidatesPage() {
  return (
    <CandidatesView 
      candidates={candidatesData.candidates as any} 
    />
  );
}
