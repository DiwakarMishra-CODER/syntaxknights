import { describe, expect, it } from "vitest";

import { RUNG_LABEL } from "@/lib/depth";

import {
  BANDS,
  HEIGHT,
  PAD_L,
  PAD_R,
  PANEL_W,
  STEP_MAX,
  STEP_MIN,
  clampDepth,
  penPosition,
  segmentPath,
  segments,
  traceStep,
  traceWidth,
  traceX,
  traceY,
  type TracePoint,
} from "./traceGeometry";

/** A fixed step, so geometry assertions do not depend on the fitting rule. */
const STEP = 34;

const p = (depth: number): TracePoint => ({ depth, day: 10, measured: true });

describe("depth mapping", () => {
  it("puts 5 at the top of the paper and 1 at the bottom", () => {
    expect(traceY(5)).toBe(16);
    expect(traceY(1)).toBe(HEIGHT - 16);
    expect(traceY(5)).toBeLessThan(traceY(1));
  });

  it("gives every depth a distinct height", () => {
    const ys = [1, 2, 3, 4, 5].map(traceY);
    expect(new Set(ys).size).toBe(5);
  });

  it("clamps out-of-range depths instead of drawing off-paper", () => {
    expect(clampDepth(0)).toBe(1);
    expect(clampDepth(-4)).toBe(1);
    expect(clampDepth(9)).toBe(5);
    expect(traceY(0)).toBe(traceY(1));
    expect(traceY(99)).toBe(traceY(5));
  });

  it("names all five bands", () => {
    expect(BANDS).toHaveLength(5);
    expect(BANDS[0]).toBe("recall");
    expect(BANDS[4]).toBe("redesign");
  });
});

describe("a real curve — climb to 5, drop to 1", () => {
  const curve = [1, 2, 3, 4, 5, 4, 2, 1].map(p);

  it("rises then falls monotonically in screen space", () => {
    const ys = curve.map((pt) => traceY(pt.depth));
    // climbing depth means decreasing y
    expect(ys[0]).toBeGreaterThan(ys[4]);
    // then falling depth means increasing y again
    expect(ys[7]).toBeGreaterThan(ys[4]);
    expect(ys[4]).toBe(traceY(5));
    expect(ys[7]).toBe(traceY(1));
  });

  it("advances the paper one step per turn", () => {
    expect(traceX(1, STEP) - traceX(0, STEP)).toBe(STEP);
    expect(traceWidth(20) - traceWidth(19)).toBe(STEP_MIN);
  });

  it("draws the whole run when every question shares a topic", () => {
    const d = segmentPath(segments(curve)[0], STEP);
    expect(d.startsWith("M")).toBe(true);
    expect(d.split("L")).toHaveLength(curve.length);
  });
});

describe("the flat fixture", () => {
  const flat = [2, 2, 2, 2, 1].map(p);

  it("still produces a drawable path", () => {
    expect(segmentPath(segments(flat)[0], STEP)).toContain("M");
  });

  it("shows the one place it does move", () => {
    expect(traceY(2)).not.toBe(traceY(1));
  });
});

describe("edge cases", () => {
  it("handles no points", () => {
    expect(segments([])).toEqual([]);
    expect(traceWidth(0)).toBeGreaterThan(0);
  });

  it("handles a single point", () => {
    expect(segmentPath(segments([p(3)])[0], STEP)).toBe("");
  });

  it("parks the pen one step ahead while thinking", () => {
    const pts = [p(3), p(4)];
    expect(penPosition(pts, true, STEP).x).toBeGreaterThan(penPosition(pts, false, STEP).x);
    expect(penPosition(pts, false, STEP).y).toBe(traceY(4));
  });

  it("gives the pen a resting place before any measurement", () => {
    expect(penPosition([], true, STEP).y).toBe(traceY(2));
  });
});

describe("segments — one run per topic", () => {
  const p = (depth: number, day: number | null, title: string | null = null) => ({
    depth,
    day,
    title,
    measured: true,
  });

  it("groups consecutive questions on the same topic", () => {
    const segs = segments([p(2, 10), p(3, 10), p(4, 10)]);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ start: 0, end: 2 });
  });

  it("breaks when the topic changes", () => {
    // The whole point: reanchorDepth drops a rung on a new topic, so a
    // bridged line renders a deliberate reset as a fall.
    const segs = segments([p(4, 10), p(5, 10), p(4, 20), p(5, 20)]);
    expect(segs).toHaveLength(2);
    expect(segs.map((s) => [s.start, s.end])).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });

  it("never draws a line across a boundary", () => {
    const points = [p(5, 10), p(3, 20)];
    for (const seg of segments(points)) expect(segmentPath(seg, STEP)).toBe("");
    // and the two points are in different segments, so nothing joins them
    expect(segments(points)).toHaveLength(2);
  });

  it("returns to the same topic as a NEW segment", () => {
    // Not one segment with a hole in it — the depth was re-anchored on the
    // way back in, same as any other topic change.
    const segs = segments([p(4, 10), p(3, 20), p(4, 10)]);
    expect(segs).toHaveLength(3);
  });

  it("keeps a null-day turn out of any run", () => {
    // The closing line written by /end has no day.
    const segs = segments([p(4, 10), p(5, 10), p(5, null)]);
    expect(segs).toHaveLength(2);
    expect(segs[1].points).toHaveLength(1);
  });

  it("carries the title through for the label", () => {
    const segs = segments([p(2, 10, "Retrieval"), p(3, 10, "Retrieval"), p(2, 20, "Memory")]);
    expect(segs.map((s) => s.title)).toEqual(["Retrieval", "Memory"]);
  });

  it("covers every point exactly once", () => {
    const points = [p(1, 5), p(2, 5), p(3, 9), p(4, 9), p(2, 5), p(3, null)];
    expect(segments(points).flatMap((s) => s.points)).toEqual(points);
  });
});

describe("traceWidth fits the questions actually asked", () => {
  it("never draws narrower than the panel it sits in", () => {
    // Three questions used to huddle in the left third with dead gridline
    // beside them, which read as a half-drawn chart.
    for (const n of [0, 1, 3, 7]) expect(traceWidth(n)).toBe(PANEL_W);
  });

  it("grows past the panel once the step bottoms out", () => {
    expect(traceWidth(20)).toBeGreaterThan(PANEL_W);
    expect(traceWidth(24)).toBeGreaterThan(traceWidth(20));
  });

  it("still leaves the last point room and never degenerates", () => {
    for (const n of [0, 1, 2, 7, 24]) {
      expect(traceWidth(n)).toBeGreaterThan(PAD_L + PAD_R);
      if (n > 0) expect(traceWidth(n)).toBeGreaterThan(traceX(n - 1, traceStep(n)));
    }
  });
});

describe("traceStep fits the chart to the interview", () => {
  it("stretches so a short interview fills the panel", () => {
    // Three questions in a 460px panel used to sit in the left third.
    expect(traceStep(3)).toBeGreaterThan(STEP_MIN * 2);
    expect(traceStep(1)).toBe(STEP_MAX);
  });

  it("bottoms out rather than crushing a long one", () => {
    expect(traceStep(24)).toBe(STEP_MIN);
    expect(traceStep(60)).toBe(STEP_MIN);
  });

  it("shrinks monotonically as questions accumulate", () => {
    let prev = Infinity;
    for (let n = 1; n <= 30; n++) {
      const s = traceStep(n);
      expect(s).toBeLessThanOrEqual(prev);
      expect(s).toBeGreaterThanOrEqual(STEP_MIN);
      prev = s;
    }
  });

  it("leaves the y-axis labels room, which is what PAD_L is for", () => {
    // The regression: "2 application" was wider than the old 74px gutter and
    // was clipped at the panel's left edge.
    const widest = Math.max(...RUNG_LABEL.map((l) => `5 ${l}`.length));
    // ~5.2px per character at the 9.5px label size, plus the 10px offset,
    // plus breathing room so the longest label does not touch the edge.
    expect(widest * 5.2 + 10 + 10).toBeLessThanOrEqual(PAD_L);
  });
});
