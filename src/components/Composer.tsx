"use client";

import { useState } from "react";

/**
 * Multi-line input with an explicit submit and a visible character count.
 *
 * Enter sends; Shift+Enter inserts a newline. This used to be the other way
 * round — Cmd/Ctrl+Enter to send — on the theory that an answer should be
 * deliberate rather than reflexive. Testing killed it: everyone types Enter,
 * gets a newline, and has to hunt for the button. Chat convention wins over
 * the theory.
 */
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
    <div className="border-t border-rule bg-paper-raised">
      <div className="mx-auto max-w-[46rem] px-10 py-5">
        <label htmlFor="answer" className="sr-only">
          Your answer
        </label>
        <textarea
          id="answer"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey) return;
            // Mid-composition Enter CONFIRMS an IME candidate — Japanese,
            // Chinese and Korean input would submit a half-typed word.
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            submit();
          }}
          rows={3}
          spellCheck
          placeholder={disabled ? "" : "Answer in your own words…"}
          className="w-full resize-none border border-rule-strong bg-paper px-4 py-3 font-apparatus text-[13px] leading-[1.7] text-graphite placeholder:text-graphite-35 focus:border-graphite-35 focus:outline-none disabled:opacity-55"
        />

        <div className="mt-2 flex items-center justify-between">
          <span className="font-apparatus text-[10.5px] tabular-nums text-graphite-35">
            {status ?? (
              <>
                {value.length} characters
                <span className="ml-3 tracking-[0.02em]">
                  Enter to send · Shift+Enter for a new line
                </span>
              </>
            )}
          </span>

          <button
            type="button"
            onClick={submit}
            disabled={disabled || value.trim().length === 0}
            className="font-apparatus border border-graphite px-4 py-[7px] text-[10.5px] uppercase tracking-[0.12em] text-graphite transition-colors hover:bg-graphite hover:text-paper disabled:cursor-not-allowed disabled:border-rule disabled:text-graphite-35 disabled:hover:bg-transparent disabled:hover:text-graphite-35"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
