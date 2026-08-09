"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface StartInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StartInterviewModal: React.FC<StartInterviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [role, setRole] = useState("Senior Distributed Systems Engineer");
  const [domain, setDomain] = useState("System Design & Architecture");
  const [experience, setExperience] = useState("5-8 Years (Senior L5)");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // To the roster, not straight into an interview. The experience tier used
    // to be mapped to one hardcoded candidate id here, which silently decided
    // who you were; every graduate has a different 31-day record and the
    // interview is planned from it, so that choice belongs to the person
    // making it. /candidates is the roster, and its profile page carries
    // the interview rules and the consent step before anything starts.
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
      router.push("/candidates");
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050806]/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#0B120E] p-6 text-left shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(31,209,106,0.12),transparent_35%)]" />
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 text-[#7E8B84] transition-colors hover:text-[#F5F7F4]"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#1FD16A]/15 text-lg font-bold text-brand-soft">
              ✓
            </div>
            <h3 className="text-xl font-sans font-semibold text-[#F5F2EB]">
              Configuring Adaptive Session
            </h3>
            <p className="text-xs font-mono text-[#8C867A]">
              Synthesizing context for {role} ({domain})
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="mb-1 block text-[11px] font-mono font-semibold uppercase tracking-wider text-brand">
                New Session Calibration
              </span>
              <h3 className="text-xl font-sans font-semibold text-[#F5F2EB]">
                Start Mock Interview
              </h3>
              <p className="mt-1 text-xs text-[#7E8B84]">
                Select your engineering profile to calibrate the adaptive evaluation engine.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="mb-1 block text-[11px] font-mono uppercase text-[#7E8B84]">
                  Target Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050806] px-3.5 py-2 text-xs text-[#F5F7F4] outline-none focus:border-[#1FD16A]"
                >
                  <option>Senior Distributed Systems Engineer</option>
                  <option>Staff Backend Architect</option>
                  <option>Principal Platform Lead</option>
                  <option>Full Stack Systems Engineer</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-mono uppercase text-[#7E8B84]">
                  Focus Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050806] px-3.5 py-2 text-xs text-[#F5F7F4] outline-none focus:border-[#1FD16A]"
                >
                  <option>System Design & High-Scale Architecture</option>
                  <option>Async Concurrency & Lock-Free Structures</option>
                  <option>API Gateway & Resilience Patterns</option>
                  <option>Distributed Consensus (Raft/Paxos)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-mono uppercase text-[#7E8B84]">
                  Experience Tier
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#050806] px-3.5 py-2 text-xs text-[#F5F7F4] outline-none focus:border-[#1FD16A]"
                >
                  <option>Early Career (0-2 YOE)</option>
                  <option>Mid-Level Software Engineer (2-5 YOE)</option>
                  <option>5-8 Years (Senior L5)</option>
                  <option>8+ Years (Staff L6+)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[rgba(255,255,255,0.08)] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-xs font-mono text-[#7E8B84] hover:text-[#F5F7F4]"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs px-5 py-2">
                Launch Session →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
