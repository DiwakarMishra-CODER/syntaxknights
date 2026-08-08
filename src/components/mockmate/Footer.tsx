import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#070A0F] border-t border-slate-800/80 py-10 text-slate-400 text-xs font-sans relative z-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        {/* Left: Brand Logo matching reference image */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#10B981] flex items-center justify-center font-sans font-bold text-[11px] text-[#070A0F]">
            M
          </div>
          <span className="text-sm font-semibold tracking-tight text-white font-sans">
            MockMate
          </span>
        </div>

        {/* Center: Essential Links matching reference image */}
        <div className="flex items-center gap-8 font-sans">
          <a href="#" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Contact
          </a>
        </div>

        {/* Right: Copyright matching reference image */}
        <div className="font-mono text-slate-500">
          © 2026 MockMate Inc.
        </div>
      </div>
    </footer>
  );
};
