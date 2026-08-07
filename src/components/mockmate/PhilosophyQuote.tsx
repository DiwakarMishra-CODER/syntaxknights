"use client";

import React from "react";

export const PhilosophyQuote: React.FC = () => {
  return (
    <section className="py-28 relative z-10 border-t border-slate-800/50 overflow-hidden text-center">
      <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10 space-y-6">
        <blockquote className="text-4xl sm:text-6xl lg:text-7xl font-editorial italic font-light text-white leading-[1.12] text-balance">
          &ldquo;Every answer changes <br />
          <span className="text-[var(--accent-champagne)] font-normal">what comes next.&rdquo;</span>
        </blockquote>

        {/* Ambient Backlight Pulse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[280px] bg-[var(--accent-champagne)] opacity-10 blur-[130px] pointer-events-none rounded-full"></div>
      </div>
    </section>
  );
};
