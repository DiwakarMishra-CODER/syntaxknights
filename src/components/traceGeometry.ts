/**
 * Pure geometry for the depth trace, kept out of the component so it can
 * be tested directly rather than by asserting on rendered markup.
 */

export interface TracePoint {
  depth: number;
  day: number | null;
  measured: boolean;
  /** The area this question was about, for the segment label. */
  title?: string | null;
}

// One ladder, one source: the trace legend and the interviewer prompt are
// literally the same five strings, so they cannot drift apart.
import { clampDepth, DEPTH_BANDS } from "@/lib/depth";

export { DEPTH_BANDS as BANDS, clampDepth };

/**
 * Room for the y-axis labels, plus breathing space.
 *
 * "2 how you used it" is the widest. At exactly its own width the label ends
 * ~7px from the panel edge, which reads as clipped even though it is not —
 * every other block in the panel is inset 20px.
 */
export const PAD_L = 116;
export const PAD_R = 22;
export const PAD_Y = 16;
export const ROW = 30;
export const HEIGHT = PAD_Y * 2 + ROW * 4;
/** Drawable width of the panel column the chart sits in. */
export const PANEL_W = 458;
/** Tight enough for a long interview to still fit before it scrolls. */
export const STEP_MIN = 34;
/** Loose enough that three questions do not huddle in the left third. */
export const STEP_MAX = 120;

/**
 * Horizontal room per question, fitted to how many there are.
 *
 * A fixed step got this wrong at both ends: reserving ten slots left seven
 * questions in two thirds of the width, and fitting exactly left three
 * questions crammed into the left third of a 460px panel with dead space
 * beside them. The step stretches for a short interview and bottoms out at
 * STEP_MIN for a long one, which then scrolls horizontally.
 */
export function traceStep(pointCount: number): number {
  const available = PANEL_W - PAD_L - PAD_R;
  // count + 0.5, not count: traceX offsets the first point by half a step,
  // so dividing by the count alone overshoots by that half and pushes the
  // chart just past the panel edge — a horizontal scrollbar for nothing.
  const raw = available / (Math.max(pointCount, 1) + 0.5);
  return Math.max(STEP_MIN, Math.min(STEP_MAX, raw));
}

/** Depth 5 sits at the top of the paper, depth 1 at the bottom. */
export const traceY = (depth: number) => PAD_Y + ROW * (5 - clampDepth(depth));
export const traceX = (i: number, step: number) => PAD_L + step * i + step / 2;

export function traceWidth(pointCount: number): number {
  const step = traceStep(pointCount);
  // Never narrower than the panel, so the gridlines reach both edges and the
  // chart does not read as a half-drawn thing floating in white space.
  return Math.max(PANEL_W, PAD_L + PAD_R + step * (pointCount + 0.5));
}

/**
 * Runs of consecutive questions on the same topic.
 *
 * The line MUST break between them. `reanchorDepth` opens every new topic one
 * rung back by design, so a bridged line renders a deliberate reset as a
 * fall — and the legend then reads it out as struggling. Segmenting is what
 * makes the caption true.
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

/** The path for one segment. A single-point segment draws no line. */
export function segmentPath(seg: TraceSegment, step: number): string {
  if (seg.points.length < 2) return "";
  return seg.points
    .map((p, i) => `${i === 0 ? "M" : "L"}${traceX(seg.start + i, step)},${traceY(p.depth)}`)
    .join(" ");
}

export function penPosition(points: TracePoint[], thinking: boolean, step: number) {
  const last = points.length - 1;
  return {
    x: thinking ? traceX(points.length, step) : traceX(Math.max(last, 0), step),
    y: points.length ? traceY(points[last].depth) : traceY(2),
  };
}
