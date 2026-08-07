"use client";

import React, { useState } from "react";

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
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[var(--glass-border)] bg-slate-900/95 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white font-mono text-sm p-2"
        >
          ✕
        </button>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-emerald-glow)] border border-[var(--accent-emerald-border)] flex items-center justify-center text-[var(--accent-emerald)] mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-2xl font-editorial text-white">
              Configuring Adaptive Session...
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Synthesizing context for {role} ({domain})
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div>
              <div className="pill-badge pill-badge-emerald mb-2">
                <span>NEW SESSION SETUP</span>
              </div>
              <h3 className="text-2xl font-editorial text-white">
                Start Your Mock Interview
              </h3>
              <p className="text-xs text-slate-400">
                Select your target engineering profile to initialize MockMate&apos;s adaptive cognitive engine.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                  Target Engineering Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-[var(--accent-emerald)] focus:outline-none"
                >
                  <option>Senior Distributed Systems Engineer</option>
                  <option>Staff Backend Architect</option>
                  <option>Principal Platform Infrastructure Lead</option>
                  <option>Full Stack Systems Engineer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                  Primary Interview Focus Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-[var(--accent-emerald)] focus:outline-none"
                >
                  <option>System Design & High-Scale Architecture</option>
                  <option>Async Concurrency & Lock-Free Data Structures</option>
                  <option>API Gateway & Resilience Patterns</option>
                  <option>Distributed Consensus (Raft/Paxos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">
                  Experience Tier Calibration
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-[var(--accent-emerald)] focus:outline-none"
                >
                  <option>Early Career / Graduate (0-2 YOE)</option>
                  <option>Mid-Level Software Engineer (2-5 YOE)</option>
                  <option>5-8 Years (Senior L5)</option>
                  <option>8+ Years (Staff L6+)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs px-6 py-2.5">
                Launch Session →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

interface WatchDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WatchDemoModal: React.FC<WatchDemoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[var(--glass-border)] bg-slate-900/95 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white font-mono text-sm p-2"
        >
          ✕
        </button>

        <div className="pill-badge pill-badge-ice mb-3">
          <span>PRODUCT DEMO WALKTHROUGH</span>
        </div>
        <h3 className="text-2xl font-editorial text-white mb-2">
          MockMate Adaptive Engine In Action
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Observe how MockMate listens to candidate responses and constructs deep architectural follow-up probes in real time.
        </p>

        {/* Video Simulation Screen */}
        <div className="aspect-video rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="w-16 h-16 rounded-full bg-[var(--accent-emerald-glow)] border border-[var(--accent-emerald-border)] flex items-center justify-center text-[var(--accent-emerald)] text-2xl pl-1 shadow-2xl cursor-pointer group-hover:scale-110 transition-transform">
            ▶
          </div>
          <div className="mt-4 text-xs font-mono text-slate-400">
            Click to Play Product Video (2:15)
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-6 py-2"
          >
            Close Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
};

interface SampleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SampleReportModal: React.FC<SampleReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-[var(--glass-border)] bg-slate-900/95 shadow-2xl relative text-left max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white font-mono text-sm p-2"
        >
          ✕
        </button>

        <div className="pill-badge pill-badge-emerald mb-3">
          <span>FULL SAMPLE DOSSIER</span>
        </div>
        <h3 className="text-2xl font-editorial text-white mb-2">
          Staff Design Review: Alex Mercer (L6 Candidate)
        </h3>
        <div className="text-xs font-mono text-slate-400 mb-6 pb-4 border-b border-slate-800">
          Target Focus: Multi-Region Event Streaming & Consensus Security • Session Date: August 2026
        </div>

        <div className="space-y-6 text-xs text-slate-300">
          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-mono text-[var(--accent-emerald)] font-bold uppercase">
              1. EXECUTIVE EVALUATION NARRATIVE
            </div>
            <p className="leading-relaxed">
              Alex demonstrated exceptional system design maturity, quickly establishing latency bounds and SLA expectations. When probed on split-brain scenarios during Raft leader election, Alex articulated the necessity of quorum writes and hazard pointer safety in C++ buffers.
            </p>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-mono text-[var(--accent-ice-blue)] font-bold uppercase">
                2. TECHNICAL REASONING
              </div>
              <p className="leading-relaxed text-slate-400">
                Strong defensive design instincts. Identified cache stampede risks before being explicitly asked by interviewer.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-mono text-[var(--accent-champagne)] font-bold uppercase">
                3. COMMUNICATION & CLARITY
              </div>
              <p className="leading-relaxed text-slate-400">
                Calm and structured under deep follow-up pressure. Clear delineation between assumptions and hard bounds.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="btn-primary text-xs px-6 py-2.5">
            Close Dossier View
          </button>
        </div>
      </div>
    </div>
  );
};
