"use client";

import React, { useState, useEffect, useRef } from "react";

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "reveal" | "done">("loading");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fast 1-second loading progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = prev < 60 ? 5 : prev < 85 ? 3 : 2;
        return Math.min(prev + increment, 100);
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100 && phase === "loading") {
      const t1 = setTimeout(() => setPhase("reveal"), 150);
      const t2 = setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 750);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [progress, phase, onComplete]);

  if (phase === "done") return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-500 ease-out ${
        phase === "reveal" ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      }`}
      style={{
        backgroundColor: "#050806",
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px]"
          style={{
            background: `radial-gradient(circle, rgba(31,209,106,${0.08 + progress * 0.002}) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo Mark */}
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center border border-[rgba(31,209,106,0.2)] bg-[#0B120E]"
            style={{
              boxShadow: `0 0 ${20 + progress * 0.4}px rgba(31,209,106,${0.1 + progress * 0.003})`,
            }}
          >
            <span
              className="text-3xl font-bold font-editorial text-[#F5F7F4]"
              style={{
                textShadow: `0 0 ${10 + progress * 0.3}px rgba(31,209,106,${progress * 0.006})`,
              }}
            >
              M
            </span>
          </div>

          {/* Orbiting dot */}
          <div
            className="absolute w-2.5 h-2.5 rounded-full bg-[#1FD16A]"
            style={{
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) rotate(${progress * 7.2}deg) translateX(48px)`,
              boxShadow: "0 0 12px rgba(31,209,106,0.8)",
              transition: "transform 0.05s linear",
            }}
          />
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1
            className="text-2xl font-editorial font-bold tracking-tight text-[#F5F7F4]"
            style={{
              animation: "preloader-text-reveal 0.8s ease-out 0.2s both",
            }}
          >
            MockMate
          </h1>
          <p
            className="text-xs font-mono tracking-[0.3em] uppercase text-[#7E8B84] mt-2"
            style={{
              animation: "preloader-text-reveal 0.8s ease-out 0.5s both",
            }}
          >
            An interviewer that thinks
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 space-y-3">
          <div className="w-full h-[2px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #1FD16A, #73F0A0)",
                boxShadow: "0 0 12px rgba(31,209,106,0.6)",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#7E8B84]">
            <span>
              {progress < 30
                ? "Initializing engine..."
                : progress < 60
                ? "Loading interview model..."
                : progress < 90
                ? "Preparing session..."
                : "Ready"}
            </span>
            <span className="text-[#1FD16A] tabular-nums">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
