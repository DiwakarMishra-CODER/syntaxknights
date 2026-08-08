"use client";

import * as React from "react";
import { ArrowRight, GitFork, ListChecks, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/landing/Reveal";

const DIVERGENCE = [
  {
    name: "Diane Foster",
    completed: "31/31",
    firstTry: "100%",
    story: "Nothing left to prove.",
  },
  {
    name: "Tyler Brooks",
    completed: "31/31",
    firstTry: "3%",
    story: "Got there, but ground it out.",
  },
];

const MOMENTS = [
  {
    step: "01",
    title: "Reads your record",
    body: "Before the first question, MockMate loads completion history, attempt count, and skipped days. Two people who both finished the course do not enter with the same context.",
  },
  {
    step: "02",
    title: "Interviews you",
    body: "A weak answer pushes the depth line upward or sideways. A strong answer earns pressure. The replay makes the adaptation visible instead of asking the judge to trust a summary.",
  },
  {
    step: "03",
    title: "Tells you what to redo",
    body: "The report closes the loop with named gaps and specific curriculum days, so the next session starts from evidence, not generic advice.",
  },
];

export function AdaptiveFlow() {
  return (
    <section className="relative z-10 bg-gradient-to-b from-[#0B120E] via-background to-[#0B120E] py-24 text-foreground lg:py-32">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#73F0A0]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-24 px-4 sm:px-6 lg:px-8">
        {/* ── The Divergence ── */}
        <Reveal>
          <div id="comparison" className="space-y-10">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <Badge variant="default" className="uppercase tracking-widest">
              <GitFork className="h-3.5 w-3.5" />
              The divergence
            </Badge>
            <h2 className="font-display text-section text-foreground">
              Same cohort.
              <br />
              <span className="text-gradient-green italic">Different interview.</span>
            </h2>
            <p className="text-base font-light leading-relaxed text-muted-foreground">
              Diane and Tyler both completed the full 31-day program. The point
              is that completion alone is not enough to explain readiness.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr]">
            {DIVERGENCE.map((person, i) => (
              <Card
                key={person.name}
                className="border-primary/15 bg-card/70 p-2 backdrop-blur-xl"
              >
                <CardContent className="gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                        Candidate {i === 0 ? "A" : "B"}
                      </p>
                      <h3 className="mt-2 font-display text-card-title text-foreground">
                        {person.name}
                      </h3>
                    </div>
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#73F0A0]">
                      {person.firstTry}
                    </span>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-[#D6E0D9]">
                    <p>
                      Completed: <span className="text-foreground">{person.completed}</span>
                    </p>
                    <p>{person.story}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex items-center justify-center px-3 text-primary">
              <div className="space-y-2 text-center">
                <Sparkles className="mx-auto h-5 w-5" />
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#8B968F]">
                  same record, different pressure
                </div>
                <ArrowRight className="mx-auto h-4 w-4 rotate-90 lg:rotate-0" />
              </div>
            </div>
          </div>
          </div>
        </Reveal>

        {/* ── The Three Moments ── */}
        <Reveal>
          <div id="how-it-works" className="space-y-10">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <Badge variant="default" className="uppercase tracking-widest">
              <ListChecks className="h-3.5 w-3.5" />
              The three moments
            </Badge>
            <h2 className="font-display text-section text-foreground">
              Read. Interview.
              <br />
              <span className="text-gradient-green">Report.</span>
            </h2>
            <p className="text-base font-light leading-relaxed text-muted-foreground">
              Those are the three things the page needs to prove. Everything else
              is just helping the judge understand the sequence quickly.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {MOMENTS.map((moment) => (
              <Card
                key={moment.step}
                className="border-border bg-card/60 p-2 backdrop-blur-xl transition-colors hover:border-primary/30"
              >
                <CardContent className="gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-2xl text-primary/70">
                      {moment.step}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-primary transition-shadow duration-500 group-hover:shadow-[0_0_12px_rgba(31,209,106,0.8)]" />
                  </div>
                  <h3 className="font-display text-card-title text-foreground">
                    {moment.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#D6E0D9]">
                    {moment.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
