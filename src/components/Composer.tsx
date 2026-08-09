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
      <div className="w-full bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-slate-800 focus-within:border-emerald-500/50 dark:focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 rounded-xl p-3 transition-all duration-200 shadow-sm">
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
            rows={3}
            spellCheck
            placeholder={
              disabled
                ? "Interviewer is preparing..."
                : "Type your response here... (Press Enter to send, Shift+Enter for new line)"
            }
            className="w-full resize-none bg-transparent font-sans text-[15px] leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none disabled:opacity-50 transition-opacity"
          />
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-slate-500">
              {status ?? `${value.length} characters`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={disabled || value.trim().length === 0}
              className="flex items-center gap-1.5 font-sans font-semibold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-lg transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed active:scale-95 shadow-sm"
            >
              <span>Submit</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
