import CandidateProfile from "@/components/dashboard/CandidateProfile";
import candidatesData from "../../../../data/candidates.json";

export const metadata = {
  title: "Candidate Profile — MockMate",
  description: "View candidate details and launch an interview.",
};

export default async function CandidatePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  
  const candidate = candidatesData.candidates.find((c: any) => c.member.id === id);

  if (!candidate) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <h1 className="text-2xl font-bold">Candidate not found</h1>
      </div>
    );
  }

  return <CandidateProfile candidate={candidate as any} />;
}
