"use client";

import React, { useState } from "react";

interface SandboxTrack {
  id: string;
  name: string;
  question: string;
  responseOptions: {
    label: string;
    text: string;
    thinking: string;
    adaptiveFollowup: string;
    memoryTags: string[];
  }[];
}

const SANDBOX_TRACKS: SandboxTrack[] = [
  {
    id: "system-design",
    name: "System Design • Distributed Cache",
    question:
      "We are designing a real-time notification service for 50 million active WebSocket connections. How do you maintain session state across a multi-region deployment?",
    responseOptions: [
      {
        label: "Distributed Pub/Sub (Redis Cluster)",
        text: "I'd route WebSocket connections through regional Envoy proxies and use a Redis Pub/Sub backbone with consistent hashing to broadcast notifications across instances.",
        thinking:
          "Analyzing architectural scalability: Candidate chose Redis Pub/Sub. Checking memory footprint under high message fanout...",
        adaptiveFollowup:
          "Redis Pub/Sub works for small payloads, but if 5 million users subscribe to the same live event, how do you prevent Redis CPU saturation during broadcast fanout?",
        memoryTags: ["WebSocket Cluster", "Redis Pub/Sub", "Envoy Proxy", "Consistent Hashing"],
      },
      {
        label: "Kafka Event Stream + Local Cache",
        text: "I'd decouple connection state from delivery. Incoming events stream into Apache Kafka topics partitioned by User ID, and regional workers pull events directly.",
        thinking:
          "Evaluating partition strategy: Candidate leveraged Kafka partition keys for deterministic routing. Checking consumer rebalance latency...",
        adaptiveFollowup:
          "Excellent decoupling. However, when a consumer node fails, Kafka triggers a partition rebalance. How will you prevent message delivery lag during consumer group rebalancing?",
        memoryTags: ["Kafka Partitioning", "User ID Hashing", "Decoupled Consumers", "Rebalance Lag"],
      },
    ],
  },
  {
    id: "backend-architecture",
    name: "Backend Architecture • Concurrency",
    question:
      "In a high-throughput API gateway processing 100,000 requests/sec, how do you prevent thread starvation when communicating with legacy REST microservices?",
    responseOptions: [
      {
        label: "Non-blocking I/O + Event Loop",
        text: "I'd use a non-blocking event-driven framework (like Netty or Node.js async I/O) with worker thread isolation so slow legacy HTTP calls don't block the main event loop.",
        thinking:
          "Evaluating thread model: Candidate articulated non-blocking I/O. Probing fallback behavior when legacy pool saturates...",
        adaptiveFollowup:
          "If the legacy microservice connection pool completely exhausts all available socket handles, how will your gateway prevent buffer overflow under sustained backpressure?",
        memoryTags: ["Non-blocking I/O", "Worker Thread Isolation", "Event Loop", "Backpressure"],
      },
    ],
  },
];

export const InteractiveSandbox: React.FC = () => {
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const track = SANDBOX_TRACKS[selectedTrackIndex];
  const option = track.responseOptions[selectedOptionIndex] || track.responseOptions[0];

  const handleSimulate = (optIdx: number) => {
    setSelectedOptionIndex(optIdx);
    setHasInteracted(true);
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    setHasInteracted(true);
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1400);
  };

  return (
    <section id="experience" className="py-24 relative z-10 border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="pill-badge pill-badge-champagne">
            <span>LIVE INTERACTIVE PREVIEW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans text-white tracking-tight">
            Experience <span className="italic text-[var(--accent-champagne)]">The Interview</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Try MockMate right now. Select an engineering domain below and test candidate responses to see real-time reasoning and adaptive follow-up generation.
          </p>
        </div>

        {/* Track Selector Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {SANDBOX_TRACKS.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTrackIndex(idx);
                setSelectedOptionIndex(0);
                setHasInteracted(false);
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-mono font-medium transition-all ${
                selectedTrackIndex === idx
                  ? "bg-[var(--accent-emerald)] text-[#0B1220] font-bold shadow-lg shadow-[var(--accent-emerald-glow)]"
                  : "glass-panel text-slate-300 hover:text-white"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Live Conversation Box */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-[var(--glass-border)] bg-slate-900/80 shadow-2xl relative max-w-4xl mx-auto">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[var(--accent-emerald)] animate-pulse"></span>
              <span className="text-xs font-mono text-slate-300">
                ACTIVE SIMULATION • {track.name}
              </span>
            </div>

            {/* Context Memory Badges */}
            <div className="hidden sm:flex items-center gap-1.5">
              {option.memoryTags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="space-y-6 text-left mb-8">
            {/* Interviewer Question */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-emerald)] to-emerald-600 flex items-center justify-center font-bold text-[#0B1220] text-sm shrink-0">
                M
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm sm:text-base text-slate-100 leading-relaxed shadow-inner flex-1">
                <div className="text-xs font-mono text-[var(--accent-emerald)] mb-1 font-semibold">
                  INTERVIEWER • QUESTION
                </div>
                {track.question}
              </div>
            </div>

            {/* Response Selectors / Interactive Triggers */}
            <div className="pl-12 space-y-3">
              <div className="text-xs font-mono text-slate-400 mb-1 uppercase tracking-wider">
                Select a candidate strategy to test adaptive reasoning:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {track.responseOptions.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleSimulate(optIdx)}
                    className={`p-4 rounded-xl text-left border text-xs font-medium transition-all ${
                      selectedOptionIndex === optIdx && hasInteracted
                        ? "bg-[var(--accent-emerald-glow)] border-[var(--accent-emerald-border)] text-white shadow-md"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <div className="font-bold text-[var(--accent-emerald)] mb-1">
                      Option {optIdx + 1}: {opt.label}
                    </div>
                    <div className="line-clamp-2 text-slate-400 font-normal">
                      {opt.text}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate Response Output */}
            {hasInteracted && (
              <div className="flex items-start gap-3 justify-end pl-12 animate-in fade-in duration-300">
                <div className="bg-[var(--accent-emerald-glow)] border border-[var(--accent-emerald-border)] rounded-2xl p-5 text-sm text-slate-100 leading-relaxed flex-1">
                  <div className="text-xs font-mono text-[var(--accent-emerald)] mb-1 font-semibold text-right">
                    CANDIDATE • ALEX M.
                  </div>
                  {customInput.trim() ? customInput : option.text}
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-[var(--accent-emerald-border)] flex items-center justify-center font-bold text-white text-sm shrink-0">
                  A
                </div>
              </div>
            )}

            {/* Thinking State */}
            {isSimulating && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-[var(--accent-ice-blue)] animate-in fade-in duration-200">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-ice-blue)] animate-ping"></span>
                <span>{option.thinking}</span>
              </div>
            )}

            {/* Adaptive Follow-up Generated */}
            {hasInteracted && !isSimulating && (
              <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-400">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-emerald)] to-emerald-600 flex items-center justify-center font-bold text-[#0B1220] text-sm shrink-0 shadow-lg">
                  M
                </div>
                <div className="bg-slate-900/90 border border-[var(--accent-ice-blue-border)] rounded-2xl p-5 text-sm sm:text-base text-white leading-relaxed flex-1 relative overflow-hidden shadow-xl">
                  <div className="text-xs font-mono text-[var(--accent-ice-blue)] mb-2 font-semibold flex items-center justify-between">
                    <span>INTERVIEWER • ADAPTIVE FOLLOW-UP</span>
                    <span className="px-2 py-0.5 bg-[var(--accent-ice-blue-glow)] rounded text-[10px]">
                      CONTEXT-AWARE
                    </span>
                  </div>
                  {option.adaptiveFollowup}
                </div>
              </div>
            )}
          </div>

          {/* Custom Candidate Response Input Form */}
          <form onSubmit={handleCustomSubmit} className="pt-4 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Or type your own custom technical response..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[var(--accent-emerald)] transition-colors"
              />
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto text-xs px-6 py-3 shrink-0"
              >
                Send Response
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
