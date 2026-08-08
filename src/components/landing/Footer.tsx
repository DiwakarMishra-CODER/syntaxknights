"use client";

import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 bg-[#0A0A0A] py-12 text-xs text-[#7E8B84] font-sans">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1FD16A]/40 bg-[#101813] font-editorial text-base font-bold text-[#F5F7F4] shadow-sm">
            M
          </div>
          <span className="text-sm font-semibold tracking-wide text-[#F5F2EB] font-sans">
            MockMate
          </span>
          <span className="text-[#8C867A]/40">•</span>
          <span className="font-light text-[#8C867A]">An interviewer that thinks.</span>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-6">
          <a href="#comparison" className="transition-colors hover:text-[#F5F2EB]">
            Why MockMate
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-[#F5F2EB]">
            How it works
          </a>
          <a href="#playground" className="transition-colors hover:text-[#F5F2EB]">
            Playground
          </a>
          <a href="#report" className="transition-colors hover:text-[#F5F2EB]">
            Readiness Report
          </a>
        </div>

        {/* Copyright */}
        <div className="text-[#8C867A]/60">
          © {new Date().getFullYear()} MockMate Inc. All rights reserved.
        </div>

      </div>
    </footer>
  );
};
