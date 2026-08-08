import { RUNG_LABEL } from "@/lib/depth";

import { TracePoint } from "./DepthTrace";

/**
 * The axis, in words a visitor can read cold.
 *
 * These were hardcoded here as ["Recall","Explain","Apply","Analyze",
 * "Redesign"] and had drifted from the ladder the interview actually climbs:
 * rung 2 is "application", 3 is "tradeoff", 4 is "edge case". The chart named
 * three things the interview never asks. Sourced from lib/depth now, which is
 * where the prompt gets its ladder too, so they cannot drift again.
 */
export const BANDS = RUNG_LABEL;

/**
 * Sized so traceWidth() fits the side panel without scaling, and so the
 * edge labels -- centred on their columns -- do not hang off either end.
 * Keep PAD_X >= COL_WIDTH / 2.
 */
export const PAD_X = 36;
export const PAD_Y = 30;
export const COL_WIDTH = 65;
export const ROW_HEIGHT = 40;

export const clampDepth = (d: number) => Math.min(Math.max(Math.round(d), 1), 5);

// Depth is X (1 to 5)
export const traceX = (depth: number) => PAD_X + COL_WIDTH * (clampDepth(depth) - 1);
// Time is Y (0 to N)
export const traceY = (i: number) => PAD_Y + ROW_HEIGHT * i;

export function traceHeight(pointCount: number): number {
  return PAD_Y * 2 + ROW_HEIGHT * Math.max(pointCount - 1, 0);
}

export function traceWidth(): number {
  return PAD_X * 2 + COL_WIDTH * 4;
}

/**
 * Runs of consecutive questions on the same topic.
 *
 * The line MUST break between them. A new topic deliberately opens one rung
 * lower, so a bridged line renders that reset as the candidate collapsing,
 * and any caption then reads it out as struggling. Orientation-independent:
 * this groups by topic; the path builder decides where the points sit.
 *
 * A null day (the closing line) never joins a run.
 */
export interface TraceSegment {
  start: number;
  end: number;
  title: string | null;
  points: TracePoint[];
}

export function segments(points: TracePoint[]): TraceSegment[] {
  const out: TraceSegment[] = [];

  points.forEach((p, i) => {
    const prev = out[out.length - 1];
    const continues =
      prev !== undefined && p.day !== null && points[i - 1]?.day === p.day;

    if (continues) {
      prev.end = i;
      prev.points.push(p);
      return;
    }
    out.push({ start: i, end: i, title: p.title ?? null, points: [p] });
  });

  return out;
}

/** One segment, vertical: depth across, question index down. */
export function segmentPath(seg: TraceSegment): string {
  if (seg.points.length < 2) return "";
  return seg.points
    .map((p, i) => `${i === 0 ? "M" : "L"}${traceX(p.depth)},${traceY(seg.start + i)}`)
    .join(" ");
}

export function settledPath(points: TracePoint[]): string {
  return points
    .slice(0, -1)
    .map((p, i) => `${i === 0 ? "M" : "L"}${traceX(p.depth)},${traceY(i)}`)
    .join(" ");
}

export function headPath(points: TracePoint[]): string {
  if (points.length < 2) return "";
  const last = points.length - 1;
  return `M${traceX(points[last - 1].depth)},${traceY(last - 1)} L${traceX(points[last].depth)},${traceY(last)}`;
}

export function penPosition(points: TracePoint[], thinking: boolean) {
  const last = points.length - 1;
  return {
    x: points.length ? traceX(points[last].depth) : traceX(2),
    y: thinking ? traceY(points.length) : traceY(Math.max(last, 0)),
  };
}
