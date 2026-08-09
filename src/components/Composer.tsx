"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

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

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full bg-[#050806] border border-white/15 focus-within:border-[#1FD16A]/50 focus-within:shadow-[0_0_15px_rgba(31,209,106,0.15)] rounded-xl p-3 transition-all duration-300 shadow-lg">
        <label htmlFor="answer" className="sr-only">
          Your response
        </label>

        <div className="relative group">
          <textarea
            id="answer"
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            spellCheck
            placeholder={
              disabled
                ? "Interviewer is typing..."
                : "Type your response... (Press Enter to send, Shift+Enter for new line)"
            }
            className="w-full resize-none bg-transparent font-sans text-sm leading-relaxed text-[#F5F7F4] placeholder:text-[#7E8B84]/70 focus:outline-none disabled:opacity-50 transition-opacity"
          />
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
          <span className="font-mono text-[11px] text-[#7E8B84]">
            {status ?? `${value.length} characters`}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={disabled || value.trim().length === 0}
              className="flex items-center gap-1.5 font-sans font-semibold text-xs uppercase tracking-wider text-black bg-[#1FD16A] hover:bg-[#1FD16A]/90 px-4 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-[#1FD16A] cursor-pointer disabled:cursor-not-allowed shadow-[0_0_12px_rgba(31,209,106,0.3)] hover:shadow-[0_0_20px_rgba(31,209,106,0.5)] active:scale-95"
            >
              <span>Send</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
