"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ArrowRight, CheckCircle2, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/landing/Reveal";

interface HeroProps {
  onOpenStartModal: () => void;
}

const REPLAY_BEATS = [
  {
    question:
      "Walk me through what happens when someone asks your chatbot about their coverage.",
    answer: "It searches the vector database and sends what it finds to the LLM.",
  },
  {
    question: "How many results does it pull back?",
    answer: "I think five. That was the default.",
  },
];

// 3D hero scene is heavy (three.js). Load it as a separate, non-blocking
// chunk so first paint / LCP isn't gated on the WebGL bundle.
const MockMateHeroScene = dynamic(
  () => import("@/components/three/MockMateHeroScene").then((m) => m.MockMateHeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto aspect-square w-full max-w-[560px] animate-pulse rounded-3xl border border-primary/10 bg-secondary/40" />
    ),
  }
);

/** The live-session card's inset from the bottom of the stage — `bottom-4`. */
const LIVE_CARD_INSET = 16;

export function Hero({ onOpenStartModal }: HeroProps) {
  const [activeBeat, setActiveBeat] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(
      () => setActiveBeat((prev) => (prev + 1) % REPLAY_BEATS.length),
      4500
    );
    return () => clearInterval(timer);
  }, []);

  // How much of the scene this card covers, so the scene can keep its own
  // overlays out of it. This used to be the literal 170 passed to
  // reserveBottom, but the card's height is whatever its text wraps to — and
  // the text ROTATES every 4.5s between beats of different lengths, so no
  // single number is right for more than a few seconds at a time. That is
  // what put the Day 22 probe panel on top of this card.
  const liveCardRef = React.useRef<HTMLDivElement>(null);
  const [reserveBottom, setReserveBottom] = React.useState(190);

  // useEffect, not useLayoutEffect: this component IS server-rendered (a
  // "use client" component still prerenders), and useLayoutEffect warns there.
  // Timing is not critical here — the scene that consumes this is a lazy,
  // ssr:false import, so it mounts well after the first measurement lands.
  React.useEffect(() => {
    const el = liveCardRef.current;
    if (!el) return;
    const measure = () => setReserveBottom(el.offsetHeight + LIVE_CARD_INSET);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const beat = REPLAY_BEATS[activeBeat];

  return (
    <section className="relative z-10 overflow-hidden bg-gradient-to-b from-background to-[var(--bg-elevated)] pb-20 pt-32 lg:pb-28 lg:pt-40">
      {/* Ambient background — pure CSS, no canvas */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(31,209,106,0.15)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute right-[-10%] top-20 h-72 w-72 rounded-full bg-[#22C55E]/10 blur-3xl" />
        <div className="absolute left-[-10%] top-40 h-64 w-64 rounded-full bg-[#73F0A0]/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-6 lg:px-8">
        {/* Left — Editorial Content */}
        <div className="space-y-7 text-left lg:col-span-6">
          <Reveal>
            <Badge variant="default" className="text-eyebrow uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              Probes beyond the surface
            </Badge>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="max-w-2xl font-display text-hero text-foreground">
              Your adaptive{" "}
              <span className="text-gradient-green">AI Interviewer</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="max-w-md text-[15px] font-light leading-relaxed text-muted-foreground sm:text-base">
              Master your next technical interview. MockMate analyzes your
              31-Day AI Cohort journey, adapts to your answers, and uncovers the
              true depth of your experience.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Button size="xl" onClick={onOpenStartModal}>
                Start practice interview
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a href="#how-it-works">
                <Button size="xl" variant="outline">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  See how it works
                </Button>
              </a>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="flex flex-wrap items-center gap-5 pt-3 text-xs text-slate-500 dark:text-[#A9B6AF]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Recorded replay
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Adapts to your answers
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Respects reduced motion
              </span>
            </div>
          </Reveal>
        </div>

        {/* Right — 3D Hero Scene (lazy) + live interview Card mock */}
        <Reveal
          delay={200}
          className="relative lg:col-span-6 lg:translate-x-8"
        >
          <div className="relative mx-auto w-full max-w-[560px]">
            <MockMateHeroScene reserveBottom={reserveBottom} />
            <Card
              ref={liveCardRef}
              className="absolute bottom-4 left-4 right-4 border-primary/15 bg-card/80 shadow-[0_24px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            >
              <CardContent className="gap-3 !py-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-primary">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Live session
                  </span>
                  <span className="flex items-center gap-1.5 text-brand-soft">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    Adaptive
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  {beat.question}
                </p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-[#D6E0D9]">
                  {beat.answer}
                </p>
              </CardContent>
            </Card>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
