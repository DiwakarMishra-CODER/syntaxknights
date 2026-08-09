"use client";

import * as React from "react";
import {
  BookOpen,
  GitBranch,
  MessageSquareQuote,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/landing/Reveal";

const DEPTH_LADDER = [
  { depth: "1", label: "Recall", note: "What happened?" },
  { depth: "2", label: "Application", note: "How did you use it?" },
  { depth: "3", label: "Trade-off", note: "What did you give up?" },
  { depth: "4", label: "Edge case", note: "What breaks first?" },
  { depth: "5", label: "Redesign", note: "What would you change?" },
];

const CLAIMS = [
  {
    text: "It searches the vector database and sends what it finds to the LLM.",
    tag: "verbatim claim",
  },
  {
    text: "I think five. That was the default.",
    tag: "number worth testing",
  },
  {
    text: "Correct but generic — that describes the diagram, not the build.",
    tag: "reasoning note",
  },
];

export function InterviewDemo() {
  const [activeLadderIndex, setActiveLadderIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(
      () => setActiveLadderIndex((prev) => (prev + 1) % DEPTH_LADDER.length),
      2500
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative z-10 bg-gradient-to-b from-[var(--bg-elevated)] to-background py-24 text-foreground lg:py-32">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#73F0A0]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <Badge variant="default" className="uppercase tracking-widest">
            <BookOpen className="h-3.5 w-3.5" />
            The playground
          </Badge>
          <h2 className="font-display text-section text-foreground">
            Live interview
            <br />
            <span className="text-gradient-green uppercase">Environment.</span>
          </h2>
          <p className="text-base font-light leading-relaxed text-muted-foreground">
            If the answer is shallow, the trace rises. If the answer holds,
            MockMate digs. The conversation and the reasoning panel stay linked
            the whole time.
            </p>
          </div>
        </Reveal>

          <Reveal>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Conversation excerpt */}
          <Card className="animate-scanline border-primary/20 bg-card/70 p-2 backdrop-blur-xl lg:col-span-7">
            <CardContent className="gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-primary">
                  <MessageSquareQuote className="h-4 w-4" />
                  Tyler&apos;s session, live trace
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="text-[10px] text-brand-soft">Processing</span>
                </div>
              </div>

              <div className="relative space-y-4 overflow-hidden rounded-2xl bg-white dark:bg-[#0A0A0A] p-5">
                <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-[rgba(31,209,106,0.1)]">
                  <div className="h-8 w-full animate-[scanline_3s_linear_infinite] bg-primary shadow-[0_0_8px_#1FD16A]" />
                </div>
                <div className="pl-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-brand-soft">
                    Interviewer
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    Walk me through what happens when someone asks your chatbot
                    about their coverage.
                  </p>
                </div>

                <div className="pl-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-primary">
                    Tyler
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                    It searches the vector database and sends what it finds to
                    the LLM.
                  </p>
                </div>

                <div className="ml-4 overflow-hidden rounded-xl border border-primary/10 bg-secondary px-4 py-3">
                  <p className="whitespace-nowrap text-xs leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                    &ldquo;Correct but generic — that describes the diagram,
                    not the build.&rdquo;
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {CLAIMS.map((claim, i) => (
                  <div
                    key={claim.tag}
                    className={`space-y-2 rounded-xl border border-primary/15 bg-secondary px-4 py-3 transition-all duration-300 ${
                      i === activeLadderIndex % 3
                        ? "animate-data-pulse bg-[rgba(31,209,106,0.05)]"
                        : ""
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-[#9FB2A7]">
                      {claim.tag}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                      {claim.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right: Depth ladder */}
          <Card className="border-primary/20 bg-card/70 p-2 backdrop-blur-xl lg:col-span-5">
            <CardContent className="gap-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-primary">
                <ShieldCheck className="h-4 w-4" />
                Active Depth Ladder
              </div>

              <div className="relative space-y-3">
                {DEPTH_LADDER.map((step, idx) => {
                  const isActive = idx === activeLadderIndex;
                  const isPassed = idx < activeLadderIndex;

                  return (
                    <div
                      key={step.depth}
                      className={`flex items-start gap-4 rounded-xl border px-4 py-3 transition-all duration-500 ${
                        isActive
                          ? "border-primary/20 bg-slate-50 dark:bg-[#0E1712] shadow-[0_0_15px_rgba(31,209,106,0.08)]"
                          : "border-transparent bg-white dark:bg-[#0A0A0A]"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-500 ${
                          isActive
                            ? "bg-primary text-background shadow-[0_0_12px_rgba(31,209,106,0.6)]"
                            : isPassed
                              ? "border border-primary/40 bg-secondary text-primary"
                              : "bg-secondary text-slate-500 dark:text-[#7E8B84]"
                        }`}
                      >
                        {step.depth}
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`text-sm font-semibold transition-colors duration-300 ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {step.label}
                        </div>
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-[#A9B6AF]">
                          {step.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-secondary px-4 py-4">
                <div className="absolute right-0 top-0 p-2">
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-brand-soft">
                  <GitBranch className="h-4 w-4" />
                  Claim ledger updating
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                  Every claim is filtered against what the candidate actually
                  said. The report only keeps what can be defended.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
