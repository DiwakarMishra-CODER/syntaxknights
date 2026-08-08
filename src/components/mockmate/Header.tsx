"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { MagneticButton } from "./MagneticButton";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenStartModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenStartModal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 py-4 md:px-8 transition-all duration-300">
      <div className="max-w-5xl mx-auto">
        <nav
          className={cn(
            "rounded-full px-6 py-3 flex items-center justify-between transition-all duration-300",
            scrolled
              ? "glass shadow-md bg-[var(--glass-fill)] border-[var(--glass-border)]"
              : "bg-transparent border border-transparent"
          )}
        >
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 text-left">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-emerald)] flex items-center justify-center font-sans font-bold text-xs text-white">
              M
            </div>
            <span className="text-base font-semibold tracking-tight text-[var(--ink-primary)] font-sans">
              MockMate
            </span>
          </a>

          {/* Minimal Nav Links */}
          <ul className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wide text-[var(--ink-muted)]">
            <li>
              <a href="#showcase" className="hover:text-[var(--ink-primary)] transition-colors">
                Showcase
              </a>
            </li>
            <li>
              <a href="#difference" className="hover:text-[var(--ink-primary)] transition-colors">
                Difference
              </a>
            </li>
            <li>
              <a href="/interview" className="hover:text-[var(--accent-emerald)] transition-colors">
                The Interview
              </a>
            </li>
            <li>
              <a href="#dossier" className="hover:text-[var(--ink-primary)] transition-colors">
                Dossier
              </a>
            </li>
          </ul>

          {/* Action CTAs + Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] text-[var(--ink-primary)] hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-fill-hover)] transition-all duration-200"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-[var(--ink-primary)]" />
              ) : (
                <Sun className="w-4 h-4 text-[var(--accent-gold)]" />
              )}
            </button>

            <MagneticButton onClick={onOpenStartModal} className="text-xs px-4 py-2">
              Start Practicing
            </MagneticButton>
          </div>

          {/* Mobile Actions: Theme Toggle + Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] text-[var(--ink-primary)]"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-[var(--ink-primary)]" />
              ) : (
                <Sun className="w-4 h-4 text-[var(--accent-gold)]" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              aria-label="Toggle Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 glass p-5 rounded-2xl space-y-4">
            <ul className="flex flex-col gap-3 text-xs font-mono text-[var(--ink-muted)]">
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
                <a href="/interview" onClick={() => setMobileMenuOpen(false)}>
                  The Interview
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
              className="w-full btn-primary text-xs py-2.5"
            >
              Start Practicing
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
