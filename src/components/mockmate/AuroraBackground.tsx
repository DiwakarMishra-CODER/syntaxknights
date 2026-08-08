"use client";

import React from "react";

export const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-10">
      {/* Asymmetric diffuse top-left wash */}
      <div 
        className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vh] rounded-full bg-[var(--accent-emerald-soft)] filter blur-[140px]" 
      />
      {/* Asymmetric diffuse bottom-right wash */}
      <div 
        className="absolute top-[40%] -right-[15%] w-[50vw] h-[50vh] rounded-full bg-[#D1E6F3] filter blur-[140px]" 
      />
    </div>
  );
};
