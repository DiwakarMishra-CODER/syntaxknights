import { Badge } from "@/components/ui/badge";

const TRUST_POINTS = [
  "31-day AI cohort",
  "Adaptive follow-ups",
  "Evidence-backed report",
  "Respects reduced motion",
];

export function TrustStrip() {
  return (
    <section className="relative z-10 border-y border-border bg-background py-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 sm:px-6 lg:px-8">
        {TRUST_POINTS.map((point) => (
          <Badge
            key={point}
            variant="secondary"
            className="rounded-full px-4 py-1.5 text-[13px] font-normal tracking-normal text-muted-foreground"
          >
            {point}
          </Badge>
        ))}
      </div>
    </section>
  );
}
