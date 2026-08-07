import { describe, expect, it } from "vitest";

import {
  BANDS,
  clampDepth,
  headPath,
  HEIGHT,
  penPosition,
  settledPath,
  traceWidth,
  traceX,
  traceY,
  type TracePoint,
} from "./traceGeometry";

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
    expect(traceX(1) - traceX(0)).toBe(34);
    // The paper holds a minimum of 10 slots so an early trace is not
    // squeezed; past that it grows one step per turn.
    expect(traceWidth(2)).toBe(traceWidth(8));
    expect(traceWidth(20) - traceWidth(19)).toBe(34);
  });

  it("draws all but the newest point in the settled path", () => {
    const d = settledPath(curve);
    expect(d.startsWith("M")).toBe(true);
    expect(d.split("L")).toHaveLength(curve.length - 1);
  });

  it("draws exactly the newest segment as the head", () => {
    const d = headPath(curve);
    expect(d).toBe(`M${traceX(6)},${traceY(2)} L${traceX(7)},${traceY(1)}`);
  });
});

describe("the flat fixture", () => {
  const flat = [2, 2, 2, 2, 1].map(p);

  it("still produces a drawable path", () => {
    expect(settledPath(flat)).toContain("M");
    expect(headPath(flat)).not.toBe("");
  });

  it("shows the one place it does move", () => {
    expect(traceY(2)).not.toBe(traceY(1));
  });
});

describe("edge cases", () => {
  it("handles no points", () => {
    expect(settledPath([])).toBe("");
    expect(headPath([])).toBe("");
    expect(traceWidth(0)).toBeGreaterThan(0);
  });

  it("handles a single point", () => {
    expect(headPath([p(3)])).toBe("");
    expect(settledPath([p(3)])).toBe("");
  });

  it("parks the pen one step ahead while thinking", () => {
    const pts = [p(3), p(4)];
    expect(penPosition(pts, true).x).toBeGreaterThan(penPosition(pts, false).x);
    expect(penPosition(pts, false).y).toBe(traceY(4));
  });

  it("gives the pen a resting place before any measurement", () => {
    expect(penPosition([], true).y).toBe(traceY(2));
  });
});
