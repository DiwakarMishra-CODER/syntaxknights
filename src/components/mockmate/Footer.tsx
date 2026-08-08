import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 bg-[var(--bg-base)] py-12 border-t border-[var(--glass-border)] text-left">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[var(--accent-emerald)] flex items-center justify-center text-white font-bold text-[10px]">
              M
            </div>
            <span className="text-sm font-semibold tracking-tight text-[var(--ink-primary)] font-sans">
              MockMate
            </span>
          </div>

          <div className="flex items-center gap-8 text-xs font-mono text-[var(--ink-muted)]">
            <a href="#" className="hover:text-[var(--ink-primary)] transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-[var(--ink-primary)] transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-[var(--ink-primary)] transition-colors">
              Contact
            </a>
          </div>

          <div className="text-xs font-mono text-[var(--ink-muted)]">
            © {new Date().getFullYear()} MockMate Inc.
          </div>
        </div>
      </div>
    </footer>
  );
};
