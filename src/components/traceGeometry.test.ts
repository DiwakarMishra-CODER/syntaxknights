import { describe, expect, it } from "vitest";

import {
  BANDS,
  clampDepth,
  headPath,
  penPosition,
  settledPath,
  traceWidth,
  traceX,
  traceY,
} from "./traceGeometry";
import type { TracePoint } from "./DepthTrace";

const p = (depth: number): TracePoint => ({ depth, day: 10, measured: true });

describe("depth mapping", () => {
  it("puts 1 on the left and 5 on the right", () => {
    expect(traceX(1)).toBeLessThan(traceX(5));
  });

  it("gives every depth a distinct x coordinate", () => {
    const xs = [1, 2, 3, 4, 5].map(traceX);
    expect(new Set(xs).size).toBe(5);
  });

  it("clamps out-of-range depths instead of drawing out of bounds", () => {
    expect(clampDepth(0)).toBe(1);
    expect(clampDepth(-4)).toBe(1);
    expect(clampDepth(9)).toBe(5);
    expect(traceX(0)).toBe(traceX(1));
    expect(traceX(99)).toBe(traceX(5));
  });

  it("names all five bands", () => {
    expect(BANDS).toHaveLength(5);
    expect(BANDS[0]).toBe("Recall");
    expect(BANDS[4]).toBe("Redesign");
  });
});

describe("a real curve — move right to 5, left to 1", () => {
  const curve = [1, 2, 3, 4, 5, 4, 2, 1].map(p);

  it("moves right then left in screen space", () => {
    const xs = curve.map((pt) => traceX(pt.depth));
    // increasing depth means increasing x
    expect(xs[0]).toBeLessThan(xs[4]);
    // then decreasing depth means decreasing x
    expect(xs[7]).toBeLessThan(xs[4]);
    expect(xs[4]).toBe(traceX(5));
    expect(xs[7]).toBe(traceX(1));
  });

  it("advances the paper one step per turn downwards", () => {
    expect(traceY(1) - traceY(0)).toBeGreaterThan(0);
    expect(traceWidth()).toBeGreaterThan(0);
  });

  it("draws all but the newest point in the settled path", () => {
    const d = settledPath(curve);
    expect(d.startsWith("M")).toBe(true);
    expect(d.split("L")).toHaveLength(curve.length - 1);
  });

  it("draws exactly the newest segment as the head", () => {
    const d = headPath(curve);
    expect(d).toBe(`M${traceX(2)},${traceY(6)} L${traceX(1)},${traceY(7)}`);
  });
});

describe("the flat fixture", () => {
  const flat = [2, 2, 2, 2, 1].map(p);

  it("still produces a drawable path", () => {
    expect(settledPath(flat)).toContain("M");
    expect(headPath(flat)).not.toBe("");
  });

  it("shows the one place it does move horizontally", () => {
    expect(traceX(2)).not.toBe(traceX(1));
  });
});

describe("edge cases", () => {
  it("handles no points", () => {
    expect(settledPath([])).toBe("");
    expect(headPath([])).toBe("");
  });

  it("handles a single point", () => {
    expect(headPath([p(3)])).toBe("");
    expect(settledPath([p(3)])).toBe("");
  });

  it("parks the pen one step ahead while thinking", () => {
    const pts = [p(3), p(4)];
    expect(penPosition(pts, true).y).toBeGreaterThan(penPosition(pts, false).y);
    expect(penPosition(pts, false).x).toBe(traceX(4));
  });

  it("gives the pen a resting place before any measurement", () => {
    expect(penPosition([], true).x).toBe(traceX(2));
  });
});
