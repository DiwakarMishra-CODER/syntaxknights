"use client";

import { useState } from "react";

export function Composer({
  onSubmit,
  disabled,
  status,
}: {
  onSubmit: (text: string) => void;
  disabled: boolean;
  status: string | null;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSubmit(text);
    setValue("");
  }

  const thinkingGlow = disabled ? "border-[#16A34A]/50 shadow-[0_0_15px_rgba(22,163,74,0.1)]" : "border-white/10 hover:border-white/20";

  return (
    <div className="w-full flex flex-col items-center">
      <div className={`w-full max-w-[48rem] bg-white/5 backdrop-blur-xl border ${thinkingGlow} rounded-2xl p-4 transition-all duration-300 shadow-xl`}>
        <label htmlFor="answer" className="sr-only">
          Your answer
        </label>
        
        <div className="relative group">
          <textarea
            id="answer"
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // Mid-composition Enter CONFIRMS an IME candidate --
              // Japanese, Chinese and Korean input would submit a
              // half-typed word.
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={3}
            spellCheck
            placeholder={disabled ? "Thinking..." : "Type your answer... (Press Enter to send, Shift+Enter for new line)"}
            className="w-full resize-none bg-transparent font-sans text-[15px] leading-[1.6] text-[#F5F7F4] placeholder:text-[#7E8B84] focus:outline-none disabled:opacity-50 transition-opacity"
          />
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="font-sans font-medium text-[11px] tabular-nums text-[#7E8B84]">
            {status ?? `${value.length} characters`}
          </span>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={submit}
              disabled={disabled || value.trim().length === 0}
              className="flex items-center gap-2 font-sans font-semibold text-[12px] uppercase tracking-widest text-white bg-[#16A34A] hover:bg-[#15803d] px-5 py-2.5 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-[#16A34A] cursor-pointer disabled:cursor-not-allowed shadow-[0_0_15px_rgba(22,163,74,0.3)] hover:shadow-[0_0_20px_rgba(22,163,74,0.5)]"
            >
              Send <span className="text-[14px]">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
