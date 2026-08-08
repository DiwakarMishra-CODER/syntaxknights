import { describe, expect, it } from "vitest";

import { RUNG_LABEL } from "@/lib/depth";

import {
  BANDS,
  clampDepth,
  COL_WIDTH,
  PAD_X,
  PAD_Y,
  ROW_HEIGHT,
  segmentPath,
  segments,
  traceHeight,
  traceWidth,
  traceX,
  traceY,
} from "./traceGeometry";

/** The chart is vertical: depth runs across, questions run down. */
const p = (depth: number, day: number | null = 1, title: string | null = null) => ({
  depth,
  day,
  title,
  measured: true,
});

describe("the axis names what the interview actually asks", () => {
  it("takes its labels from the ladder, not a local copy", () => {
    // Hardcoded as ["Recall","Explain","Apply","Analyze","Redesign"], which
    // had drifted: rung 2 is "application", 3 is "tradeoff", 4 is "edge
    // case". The chart named three rungs the interview never asks for.
    expect(BANDS).toEqual([...RUNG_LABEL]);
    expect(BANDS).toHaveLength(5);
  });
});

describe("geometry", () => {
  it("puts depth across and questions down", () => {
    expect(traceX(1)).toBeLessThan(traceX(5));
    expect(traceY(0)).toBeLessThan(traceY(4));
    expect(traceX(1)).toBe(PAD_X);
    expect(traceY(0)).toBe(PAD_Y);
  });

  it("advances one row per question and one column per rung", () => {
    expect(traceY(1) - traceY(0)).toBe(ROW_HEIGHT);
    expect(traceX(2) - traceX(1)).toBe(COL_WIDTH);
  });

  it("clamps rather than drawing off the paper", () => {
    expect(clampDepth(0)).toBe(1);
    expect(clampDepth(9)).toBe(5);
    expect(traceX(0)).toBe(traceX(1));
    expect(traceX(99)).toBe(traceX(5));
  });

  it("grows down the page with the interview", () => {
    // Questions run downward, which is why this belongs in a tall narrow
    // column rather than the centre.
    expect(traceHeight(10)).toBeGreaterThan(traceHeight(3));
    expect(traceHeight(0)).toBeGreaterThan(0);
    expect(traceWidth()).toBe(PAD_X * 2 + COL_WIDTH * 4);
  });
});

describe("segments — one run per topic", () => {
  it("groups consecutive questions on the same topic", () => {
    const segs = segments([p(2, 10), p(3, 10), p(4, 10)]);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ start: 0, end: 2 });
  });

  it("breaks when the topic changes", () => {
    const segs = segments([p(4, 10), p(5, 10), p(4, 20), p(5, 20)]);
    expect(segs.map((s) => [s.start, s.end])).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });

  it("never draws a line across a boundary", () => {
    const segs = segments([p(5, 10), p(3, 20)]);
    expect(segs).toHaveLength(2);
    for (const seg of segs) expect(segmentPath(seg)).toBe("");
  });

  it("returns to an earlier topic as a NEW run", () => {
    expect(segments([p(4, 10), p(3, 20), p(4, 10)])).toHaveLength(3);
  });

  it("keeps a null-day turn out of any run", () => {
    const segs = segments([p(4, 10), p(5, 10), p(5, null)]);
    expect(segs).toHaveLength(2);
    expect(segs[1].points).toHaveLength(1);
  });

  it("carries the title through", () => {
    const segs = segments([p(2, 10, "Retrieval"), p(3, 10, "Retrieval"), p(2, 20, "Memory")]);
    expect(segs.map((s) => s.title)).toEqual(["Retrieval", "Memory"]);
  });

  it("covers every point exactly once", () => {
    const points = [p(1, 5), p(2, 5), p(3, 9), p(4, 9), p(2, 5), p(3, null)];
    expect(segments(points).flatMap((s) => s.points)).toEqual(points);
  });

  it("draws a run down the page, one point per row", () => {
    const d = segmentPath(segments([p(2, 7), p(3, 7), p(4, 7)])[0]);
    expect(d.startsWith("M")).toBe(true);
    expect(d.split("L")).toHaveLength(3);
    expect(d).toContain(`${traceX(2)},${traceY(0)}`);
    expect(d).toContain(`${traceX(4)},${traceY(2)}`);
  });

  it("offsets a later run by its start index", () => {
    const segs = segments([p(3, 1), p(4, 2), p(5, 2)]);
    expect(segmentPath(segs[1])).toContain(`${traceX(4)},${traceY(1)}`);
  });
});
