import Dashboard from "@/components/dashboard/Dashboard";
import candidatesData from "../../../data/candidates.json";
import curriculumData from "../../../data/curriculum.json";

export const metadata = {
  title: "Dashboard — MockMate",
  description: "View candidates and cohort curriculum.",
};

export default function DashboardPage() {
  return (
    <Dashboard 
      candidates={candidatesData.candidates as any} 
      curriculum={curriculumData as any} 
    />
  );
}
