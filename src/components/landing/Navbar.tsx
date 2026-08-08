"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onOpenStartModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenStartModal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <nav
          className={cn(
            "flex items-center justify-between rounded-full px-5 py-3.5 transition-all duration-500 md:px-6",
            scrolled
              ? "glass-card bg-[#050806]/90 shadow-2xl"
              : "border-transparent bg-transparent"
          )}
        >
          {/* Left: MockMate Logo */}
          <motion.a
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            href="#"
            className="group flex items-center gap-2.5 text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#101813] text-sm font-bold text-[#F5F7F4] shadow-sm transition-transform group-hover:scale-105 font-editorial">
              M
            </div>
            <span className="text-base font-semibold tracking-tight text-[#F5F7F4] font-sans">
              MockMate
            </span>
          </motion.a>

          {/* Center: Essential Nav Links */}
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden items-center gap-8 text-[13px] tracking-wide text-[#CFD7D0] font-sans md:flex"
          >
            <li>
              <a href="#comparison" className="transition-colors hover:text-[#F5F7F4]">
                The divergence
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="transition-colors hover:text-[#F5F7F4]">
                The three moments
              </a>
            </li>
            <li>
              <a href="#playground" className="transition-colors hover:text-[#F5F7F4]">
                Inside the interview
              </a>
            </li>
            <li>
              <a href="#report" className="transition-colors hover:text-[#F5F7F4]">
                The report
              </a>
            </li>
          </motion.ul>

          {/* Right: Start Interview CTA */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden items-center md:flex"
          >
            <button onClick={onOpenStartModal} className="btn-pill-amber text-xs h-9 px-4">
              Start Practice
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </motion.div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-full p-2 text-[#CFD7D0] transition-colors hover:text-[#F5F7F4] md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
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
          <div className="glass-card-amber mt-2 space-y-4 rounded-2xl p-5 md:hidden">
            <ul className="flex flex-col gap-4 text-sm text-[#CFD7D0] font-sans">
              <li>
                <a href="#comparison" onClick={() => setMobileMenuOpen(false)}>
                  The divergence
                </a>
              </li>
              <li>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                  The three moments
                </a>
              </li>
              <li>
                <a href="#playground" onClick={() => setMobileMenuOpen(false)}>
                  Inside the interview
                </a>
              </li>
              <li>
                <a href="#report" onClick={() => setMobileMenuOpen(false)}>
                  The report
                </a>
              </li>
            </ul>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenStartModal();
              }}
              className="btn-pill-amber w-full py-3 text-sm"
            >
              Start Practice →
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
