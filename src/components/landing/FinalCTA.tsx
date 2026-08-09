"use client";

import * as React from "react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/Reveal";

interface FinalCTAProps {
  onOpenStartModal: () => void;
}

export function FinalCTA({ onOpenStartModal }: FinalCTAProps) {
  return (
    <section className="relative z-10 overflow-hidden bg-gradient-to-b from-[#0B120E] to-background py-24 text-foreground lg:py-32">
      {/* Ambient effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-16 h-72 w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(31,209,106,0.12)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
        <div className="mx-auto max-w-3xl space-y-8">
          <Badge variant="default" className="uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            Start practicing today
          </Badge>

          <h2 className="font-display text-section text-foreground">
            Every other mock interview guesses from your CV.
            <br />
            <span className="text-gradient-green">This one knows.</span>
          </h2>

          <p className="text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
            Start with Tyler&apos;s recorded session or open the modal and choose
            another candidate. The point is the same: a real interview, not a
            generic practice flow.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
            <Button size="xl" onClick={onOpenStartModal}>
              Start practice interview
              <ArrowRight className="h-4 w-4" />
            </Button>
            <a href="#comparison">
              <Button size="xl" variant="outline">
                See the divergence
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-[#8B968F]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#73F0A0]" />
              No credit card required
            </span>
            <span>Recorded replay</span>
            <span>Real interview logic</span>
          </div>
        </div>
      </Reveal>
      </div>
    </section>
  );
}
