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

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-[48rem]">
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
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            rows={5}
            spellCheck
            placeholder={disabled ? "" : "Explain your thinking..."}
            className="w-full resize-none bg-transparent font-editorial text-[18px] leading-[1.6] text-graphite placeholder:text-graphite-35 focus:outline-none disabled:opacity-50 transition-opacity"
          />
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-rule pt-4">
          <span className="font-apparatus text-[10.5px] tabular-nums text-graphite-35">
            {status ?? `${value.length} characters`}
          </span>

          <div className="flex items-center gap-4">
            <span className="font-apparatus text-[10px] text-graphite-35 hidden sm:inline-block">
              {/* Note: In a real app we might sniff OS, but ⌘ Enter is good for Mac */}
              ⌘ Enter to send
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={disabled || value.trim().length === 0}
              className="flex items-center gap-2 font-apparatus text-[11px] uppercase tracking-widest text-graphite transition-all hover:text-accent-emerald disabled:opacity-30 disabled:hover:text-graphite cursor-pointer disabled:cursor-not-allowed"
            >
              Send answer <span className="text-[14px]">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
