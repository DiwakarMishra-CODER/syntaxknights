"use client";

import * as React from "react";
import { Activity, ArrowRight, Award, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/landing/Reveal";

const NEXT_STEPS = [
  {
    day: "Day 23",
    title: "Model Context Protocol",
    note: "Redo the tool schema decision, then revisit the interface contract.",
  },
  {
    day: "Day 24",
    title: "Tooling follow-through",
    note: "You passed both attempts, but the interview shows the schema logic is still shaky.",
  },
  {
    day: "Day 27",
    title: "Security, Privacy & Guardrails",
    note: "Close the gap on defensive reasoning and keep the claim language tight.",
  },
];

export function ReadinessReport() {
  const [pulseMetric, setPulseMetric] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setPulseMetric((prev) => (prev + 1) % 3), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative z-10 bg-gradient-to-b from-background to-[#0B120E] py-24 text-foreground lg:py-32">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-[#73F0A0]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <Badge variant="default" className="uppercase tracking-widest">
            <Award className="h-3.5 w-3.5" />
            The report
          </Badge>
          <h2 className="font-display text-section text-foreground">
            An annotated transcript.
            <br />
            <span className="text-gradient-green italic">Not a scorecard.</span>
          </h2>
          <p className="text-base font-light leading-relaxed text-muted-foreground">
            The report should help the judge understand why the interview landed
            the way it did, then point the candidate to the next useful days.
            </p>
          </div>
        </Reveal>

          <Reveal>
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-6">
            <Card className="animate-scanline border-primary/20 bg-card/70 p-2 backdrop-blur-xl">
              <CardContent className="gap-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Activity className="h-4 w-4" />
                    Live Evidence summary
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-[#73F0A0]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    Analyzing
                  </span>
                </div>

                <blockquote className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5 text-sm leading-relaxed text-[#D6E0D9]">
                  &ldquo;Redid Day 23 (MCP server build), then Day 24. You passed
                  both, but on the second attempt, and the interview showed the
                  gap is in tool schema design.&rdquo;
                </blockquote>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: "Concept", value: "Strong", active: pulseMetric === 0 },
                    { label: "Communication", value: "Uneven", active: pulseMetric === 1 },
                    { label: "Signal", value: "Tighten reasoning", active: pulseMetric === 2 },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className={`rounded-xl border bg-secondary px-4 py-3 transition-colors duration-300 ${
                        metric.active
                          ? "border-primary/40 bg-[rgba(31,209,106,0.05)]"
                          : "border-white/5"
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[#9FB2A7]">
                        {metric.label}
                      </div>
                      <div
                        className={`mt-2 flex items-center justify-between text-sm ${
                          metric.active ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {metric.value}
                        {metric.active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/60 p-2 backdrop-blur-xl transition-colors hover:border-primary/30">
              <CardContent className="gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors group-hover:text-primary">
                  <FileText className="h-4 w-4 text-primary" />
                  Direct Transcript Evidence
                </div>

                <blockquote className="rounded-2xl bg-[#0A0A0A] p-4 text-sm italic leading-relaxed text-[#D6E0D9]">
                  &ldquo;Correct but generic — he is describing the diagram, not
                  the build. Pushing for a number he should know.&rdquo;
                </blockquote>

                <div className="flex items-center justify-between text-xs text-[#8B968F]">
                  <span>Evaluated by MockMate AI</span>
                  <span className="flex items-center gap-1.5 text-primary">
                    Verbatim checked
                    <Award className="h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/5 bg-card/60 p-2 backdrop-blur-xl transition-colors hover:border-primary/20 lg:col-span-6">
            <CardContent className="gap-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-card-title text-foreground">
                  Next steps, tied to curriculum days
                </h3>
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>

              <div className="space-y-4">
                {NEXT_STEPS.map((step) => (
                  <div
                    key={step.day}
                    className="cursor-pointer rounded-2xl border border-transparent bg-[#0A0A0A] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-[#0E1712] hover:shadow-[0_4px_20px_rgba(31,209,106,0.05)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-primary">
                        {step.day}
                      </span>
                      <span className="text-[11px] text-[#8B968F]">{step.title}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#D6E0D9]">
                      {step.note}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
            </Card>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
