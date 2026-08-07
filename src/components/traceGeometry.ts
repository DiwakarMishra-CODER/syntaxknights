/**
 * Pure geometry for the depth trace, kept out of the component so it can
 * be tested directly rather than by asserting on rendered markup.
 */

export interface TracePoint {
  depth: number;
  day: number | null;
  measured: boolean;
}

export const BANDS = ["recall", "application", "tradeoff", "edge case", "redesign"];

export const PAD_L = 74;
export const PAD_R = 22;
export const PAD_Y = 16;
export const ROW = 30;
export const HEIGHT = PAD_Y * 2 + ROW * 4;
/** Horizontal room per turn; the paper advances by this much each time. */
export const STEP = 34;

export const clampDepth = (d: number) => Math.min(Math.max(Math.round(d), 1), 5);

/** Depth 5 sits at the top of the paper, depth 1 at the bottom. */
export const traceY = (depth: number) => PAD_Y + ROW * (5 - clampDepth(depth));
export const traceX = (i: number) => PAD_L + STEP * i + STEP / 2;

export function traceWidth(pointCount: number): number {
  const slots = Math.max(pointCount + 1, 10);
  return PAD_L + PAD_R + STEP * slots;
}

/** The settled line: everything except the newest segment. */
export function settledPath(points: TracePoint[]): string {
  return points
    .slice(0, -1)
    .map((p, i) => `${i === 0 ? "M" : "L"}${traceX(i)},${traceY(p.depth)}`)
    .join(" ");
}

/** The newest segment, drawn separately so the head can read as live. */
export function headPath(points: TracePoint[]): string {
  if (points.length < 2) return "";
  const last = points.length - 1;
  return `M${traceX(last - 1)},${traceY(points[last - 1].depth)} L${traceX(last)},${traceY(points[last].depth)}`;
}

export function penPosition(points: TracePoint[], thinking: boolean) {
  const last = points.length - 1;
  return {
    x: thinking ? traceX(points.length) : traceX(Math.max(last, 0)),
    y: points.length ? traceY(points[last].depth) : traceY(2),
  };
}
