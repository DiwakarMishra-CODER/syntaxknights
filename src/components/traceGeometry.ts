import { TracePoint } from "./DepthTrace";

export const BANDS = ["Recall", "Explain", "Apply", "Analyze", "Redesign"];

export const PAD_X = 60;
export const PAD_Y = 30;
export const COL_WIDTH = 100;
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
