"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, GraduationCap, CheckCircle, ChevronRight, BarChart, BookOpen, Clock, Search } from "lucide-react";

type Candidate = {
  member: {
    id: string;
    name: string;
    jobRole: string;
    yearsExperience: number;
    education: string;
    status: string;
  };
  signals: {
    commitDays: number;
    missionsCompleted: number;
    missionsFirstTry: number;
  };
  missions: any[];
};

type Curriculum = {
  cohort: string;
  modules: any[];
  days: any[];
};

export default function Dashboard({
  candidates,
  curriculum,
}: {
  candidates: Candidate[];
  curriculum: Curriculum;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Aggregated Stats
  const totalCandidates = candidates.length;
  const avgExperience = useMemo(() => {
    const total = candidates.reduce((sum, c) => sum + c.member.yearsExperience, 0);
    return (total / totalCandidates).toFixed(1);
  }, [candidates, totalCandidates]);

  const avgCompletion = useMemo(() => {
    const total = candidates.reduce((sum, c) => sum + (c.signals.missionsCompleted / 31) * 100, 0);
    return Math.round(total / totalCandidates);
  }, [candidates, totalCandidates]);

  const handleStartInterview = (id: string) => {
    router.push(`/interview?candidateId=${id}`);
  };

  const filteredCandidates = searchQuery.trim() === "" 
    ? [] 
    : candidates.filter(c => c.member.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-editorial selection:bg-emerald-200">
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-editorial font-bold text-slate-900 tracking-tight">
            Cohort Dashboard
          </h1>
          <p className="text-lg text-slate-500 mt-2">
            {curriculum.cohort} • Select a candidate to begin their adaptive interview.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            title="Total Candidates"
            value={totalCandidates.toString()}
            icon={<Users className="w-5 h-5 text-emerald-600" />}
          />
          <StatCard
            title="Average Experience"
            value={`${avgExperience} Years`}
            icon={<Clock className="w-5 h-5 text-emerald-600" />}
          />
          <StatCard
            title="Avg Completion Rate"
            value={`${avgCompletion}%`}
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Candidates List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-white flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Candidate Search</h3>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate by name..."
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64 bg-slate-50"
                  />
                </div>
              </div>
              <div className="overflow-x-auto min-h-[300px]">
                {searchQuery.trim() === "" ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                    <Search className="w-10 h-10 mb-4 text-slate-300" />
                    <p>Search for a candidate to view their details and start an interview.</p>
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                    <p>No candidates found matching "{searchQuery}"</p>
                  </div>
                ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Candidate</th>
                      <th className="px-6 py-4 font-medium">Role & Experience</th>
                      <th className="px-6 py-4 font-medium">Progress</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.member.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {candidate.member.name}
                            </span>
                            <span className="text-sm text-slate-500 mt-0.5">
                              {candidate.member.id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-700">{candidate.member.jobRole}</span>
                            <span className="text-sm text-slate-500 mt-0.5">
                              {candidate.member.yearsExperience} yrs • {candidate.member.education}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${(candidate.signals.missionsCompleted / 31) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-600">
                              {candidate.signals.missionsCompleted}/31
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleStartInterview(candidate.member.id)}
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors group-hover:border-emerald-300"
                          >
                            Interview
                            <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            </div>
          </div>

          {/* Curriculum Snapshot */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="px-6 py-5 border-b border-slate-100 bg-white">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Curriculum Focus
                </h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-600 mb-6">
                  The candidates completed {curriculum.modules.length} modules covering AI foundations, agents, and deployments.
                </p>
                <div className="space-y-4">
                  {curriculum.modules.map((mod) => (
                    <div key={mod.n} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-medium">
                        {mod.n}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-800">{mod.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Days {mod.days[0]}-{mod.days[1]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
