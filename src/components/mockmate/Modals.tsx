"use client";

import React, { useState } from "react";
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink-primary)]/40 backdrop-blur-sm">
      <div className="bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)] flex items-center justify-center mx-auto text-lg font-bold">
              ✓
            </div>
            <h3 className="text-xl font-editorial text-[var(--ink-primary)] font-semibold">
              Configuring Adaptive Session
            </h3>
            <p className="text-xs font-mono text-[var(--ink-muted)]">
              Synthesizing context for {role} ({domain})
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[11px] font-mono text-[var(--accent-emerald)] font-semibold uppercase tracking-wider block mb-1">
                New Session Calibration
              </span>
              <h3 className="text-xl font-editorial text-[var(--ink-primary)] font-semibold">
                Start Mock Interview
              </h3>
              <p className="text-xs text-[var(--ink-muted)] mt-1">
                Select your engineering profile to calibrate the adaptive evaluation engine.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-mono text-[var(--ink-muted)] mb-1 uppercase">
                  Target Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--glass-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-emerald)] focus:outline-none"
                >
                  <option>Senior Distributed Systems Engineer</option>
                  <option>Staff Backend Architect</option>
                  <option>Principal Platform Lead</option>
                  <option>Full Stack Systems Engineer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--ink-muted)] mb-1 uppercase">
                  Focus Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--glass-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-emerald)] focus:outline-none"
                >
                  <option>System Design & High-Scale Architecture</option>
                  <option>Async Concurrency & Lock-Free Structures</option>
                  <option>API Gateway & Resilience Patterns</option>
                  <option>Distributed Consensus (Raft/Paxos)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--ink-muted)] mb-1 uppercase">
                  Experience Tier
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--glass-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ink-primary)] focus:border-[var(--accent-emerald)] focus:outline-none"
                >
                  <option>Early Career (0-2 YOE)</option>
                  <option>Mid-Level Software Engineer (2-5 YOE)</option>
                  <option>5-8 Years (Senior L5)</option>
                  <option>8+ Years (Staff L6+)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-[var(--glass-border)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-mono text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
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
