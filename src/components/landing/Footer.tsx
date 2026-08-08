"use client";

import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 bg-[#050806] py-14 text-xs text-[#7E8B84] border-t border-[rgba(255,255,255,0.04)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 sm:flex-row sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#101813] border border-[rgba(31,209,106,0.2)] font-editorial text-sm font-bold text-[#F5F7F4] shadow-sm">
            M
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-wide text-[#F5F7F4] font-editorial">
              MockMate
            </span>
            <span className="text-[10px] font-light text-[#7E8B84]">
              An interviewer that thinks.
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-6">
          {[
            { href: "#comparison", label: "The divergence" },
            { href: "#how-it-works", label: "How it works" },
            { href: "#playground", label: "Playground" },
            { href: "#report", label: "Report" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[#1FD16A]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-[#7E8B84]/60">
          © {new Date().getFullYear()} MockMate Inc.
        </div>
      </div>
    </footer>
  );
};
