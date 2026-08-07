"use client";

import React, { useState } from "react";

interface HeaderProps {
  onOpenStartModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenStartModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 py-5 md:px-8 transition-all duration-300">
      <div className="max-w-6xl mx-auto">
        <nav className="glass-nav rounded-full px-6 py-3 flex items-center justify-between border border-[var(--glass-border)] shadow-2xl">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 text-left group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent-emerald)] to-[#10B981] flex items-center justify-center shadow-lg shadow-[var(--accent-emerald-glow)] group-hover:scale-105 transition-transform">
              <span className="text-[#0B1220] font-bold text-sm font-sans">M</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white font-sans">
              Mock<span className="text-[var(--accent-emerald)] font-light">Mate</span>
            </span>
          </a>

          {/* Minimal Nav Links */}
          <ul className="hidden md:flex items-center gap-10 text-xs font-mono tracking-wider uppercase text-slate-300">
            <li>
              <a href="#showcase" className="hover:text-[var(--accent-emerald)] transition-colors">
                Showcase
              </a>
            </li>
            <li>
              <a href="#difference" className="hover:text-[var(--accent-emerald)] transition-colors">
                Difference
              </a>
            </li>
            <li>
              <a href="#dossier" className="hover:text-[var(--accent-emerald)] transition-colors">
                Dossier
              </a>
            </li>
          </ul>

          {/* Single Action CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onOpenStartModal}
              className="btn-primary text-xs px-5 py-2.5 font-medium tracking-wide shadow-md hover:shadow-lg"
            >
              Start Practicing
            </button>
          </div>

          {/* Mobile Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile Overlay Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 glass-panel rounded-2xl p-6 border border-slate-800 animate-in fade-in duration-200">
            <ul className="flex flex-col gap-4 text-sm font-mono text-slate-200 mb-6">
              <li>
                <a href="#showcase" onClick={() => setMobileMenuOpen(false)}>
                  Showcase
                </a>
              </li>
              <li>
                <a href="#difference" onClick={() => setMobileMenuOpen(false)}>
                  Difference
                </a>
              </li>
              <li>
                <a href="#dossier" onClick={() => setMobileMenuOpen(false)}>
                  Dossier
                </a>
              </li>
            </ul>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenStartModal();
              }}
              className="w-full btn-primary text-center justify-center py-3 text-xs"
            >
              Start Practicing
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
