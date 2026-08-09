"use client";

import { useEffect, useState, useRef } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { playAlarmSound, stopAlarmSound } from "@/lib/audio";

export function ProctorEngine({
  onViolation,
  onForceEnd,
}: {
  onViolation?: (isViolating: boolean) => void;
  onForceEnd?: () => void;
}) {
  const [violationActive, setViolationActive] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const attemptedFullscreen = useRef(false);

  useEffect(() => {
    // Attempt to enter fullscreen immediately when the interview mounts
    if (!attemptedFullscreen.current) {
      attemptedFullscreen.current = true;
      try {
        if (document.documentElement.requestFullscreen) {
          // Note: Browsers usually block this without a direct user gesture,
          // but if the page was opened via a client-side click, it might succeed.
          document.documentElement.requestFullscreen().catch(() => {
            console.log("Fullscreen request blocked by browser policy. User must manually enter fullscreen.");
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerViolation();
      }
    };

    const handleBlur = () => {
      triggerViolation();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      stopAlarmSound();
    };
  }, []);

  const triggerViolation = () => {
    setStrikes((prev) => {
      const newStrikes = prev + 1;
      
      if (newStrikes >= 3) {
        stopAlarmSound();
        if (onForceEnd) onForceEnd();
        return newStrikes;
      }

      setViolationActive(true);
      playAlarmSound();
      if (onViolation) onViolation(true);
      return newStrikes;
    });
  };

  const clearViolation = () => {
    setViolationActive(false);
    stopAlarmSound();
    if (onViolation) onViolation(false);
    
    // Attempt fullscreen again now that we have a definitive user click gesture
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {
      // Ignore
    }
  };

  if (!violationActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-rose-950/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
      {/* Flashing red overlay effect */}
      <div className="absolute inset-0 bg-red-600 mix-blend-overlay opacity-20 animate-pulse pointer-events-none"></div>
      
      <div className="relative max-w-lg w-full p-8 rounded-3xl bg-[#0a0f12] border border-rose-500/50 shadow-[0_0_100px_rgba(225,29,72,0.3)] text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center animate-bounce">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-rose-500 uppercase tracking-widest">
            {strikes >= 3 ? "Interview Terminated" : "Warning"}
          </h1>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Tab Switching Detected
          </h2>
          <p className="text-sm text-rose-200/70 leading-relaxed font-mono">
            {strikes >= 3
              ? "You have exceeded the maximum number of tab-switching violations. This interview session has been forcefully ended."
              : `You have navigated away from the interview screen. This session is actively monitored. Please return to the interview immediately. (Strike ${strikes} of 3)`}
          </p>
        </div>
        
        <div className="pt-4">
          <button
            onClick={() => {
              clearViolation();
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white uppercase tracking-wider bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg active:scale-95"
          >
            <AlertTriangle className="w-5 h-5" />
            I Acknowledge, Return to Interview
          </button>
        </div>
      </div>
    </div>
  );
}
