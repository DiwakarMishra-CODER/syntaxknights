"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onOpenStartModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenStartModal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 px-4 py-4 transition-all duration-300 md:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "flex items-center justify-between rounded-2xl px-5 py-3.5 transition-all duration-500 md:px-6",
            scrolled
              ? "bg-white/80 dark:bg-[#050806]/92 backdrop-blur-xl shadow-2xl border-slate-200 dark:border-[rgba(31,209,106,0.08)]"
              : "bg-transparent border border-transparent"
          )}
        >
          {/* Left: MockMate Logo */}
          <a href="#" className="group flex items-center gap-2.5 text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-[#101813] border border-slate-200 dark:border-[rgba(31,209,106,0.2)] text-sm font-bold text-slate-900 dark:text-[#F5F7F4] shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-400 dark:group-hover:border-[rgba(31,209,106,0.4)] group-hover:shadow-[0_0_16px_rgba(31,209,106,0.15)] font-sans tracking-tight">
              M
            </div>
            <span className="text-base tracking-tight text-slate-900 dark:text-[#F5F7F4] font-sans font-medium">
              MockMate
            </span>
          </a>

          {/* Center: Essential Nav Links */}
          <ul className="hidden items-center gap-8 text-[13px] tracking-wide text-slate-600 dark:text-[#CFD7D0] md:flex">
            {[
              { href: "#comparison", label: "Comparison" },
              { href: "#how-it-works", label: "How it Works" },
              { href: "#playground", label: "Live Demo" },
              { href: "#report", label: "Readiness Report" },
            ].map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="relative py-1 transition-colors hover:text-emerald-600 dark:hover:text-[#F5F7F4] group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#1FD16A] transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          {/* Right: Start Interview CTA & Theme Toggle */}
          <div className="hidden items-center gap-3 md:flex">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={onOpenStartModal}
              className="btn-primary text-xs h-10 px-5 rounded-xl"
            >
              Start Practice
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-full p-2 text-slate-600 dark:text-[#CFD7D0] transition-colors hover:text-slate-900 dark:text-[#F5F7F4] md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 8h16M4 16h16"
                />
              )}
            </svg>
          </button>
        </motion.nav>

        {/* Mobile Overlay Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card-green mt-2 space-y-4 rounded-2xl p-5 md:hidden"
            >
              <ul className="flex flex-col gap-4 text-sm text-slate-600 dark:text-[#CFD7D0]">
                {[
                  { href: "#comparison", label: "Comparison" },
                  { href: "#how-it-works", label: "How it Works" },
                  { href: "#playground", label: "Live Demo" },
                  { href: "#report", label: "Readiness Report" },
                ].map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="hover:text-slate-900 dark:text-[#F5F7F4] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-4 pt-2">
                {mounted && (
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    {theme === 'dark' ? (
                      <><Sun className="w-4 h-4" /> Light Mode</>
                    ) : (
                      <><Moon className="w-4 h-4" /> Dark Mode</>
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenStartModal();
                  }}
                  className="btn-primary flex-[2] py-3 text-sm"
                >
                  Start Practice →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
