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
      </div>
    </section>
  );
};
