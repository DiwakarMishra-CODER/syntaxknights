import { afterEach, describe, expect, it } from "vitest";

import { orderKeysByQuota, pinnedKeyIndex } from "./llm";
import {
  pacificDay,
  nextQuotaReset,
  tallyEvents,
  tallyKey,
  type QuotaEvent,
  type Tally,
} from "./quota-log";

const FLASH = "gemini-3.6-flash";
const LITE = "gemini-3.5-flash-lite";

function talliesFrom(
  entries: Array<[string, number, Partial<Tally>]>
): Map<string, Tally> {
  const m = new Map<string, Tally>();
  for (const [model, key, t] of entries) {
    m.set(tallyKey(model, key), { ok: 0, rateLimited: 0, errors: 0, ...t });
  }
  return m;
}

describe("orderKeysByQuota", () => {
  it("drops a key that already 429'd today for that model", () => {
    const tallies = talliesFrom([
      [FLASH, 0, { ok: 20, rateLimited: 15 }],
      [FLASH, 1, { ok: 0 }],
    ]);
    expect(orderKeysByQuota({ keyCount: 2, model: FLASH, tallies })).toEqual([1]);
  });

  it("only drops it for the model that was exhausted", () => {
    const tallies = talliesFrom([[FLASH, 0, { rateLimited: 15 }]]);
    // Key 0 is spent for 3.6-flash but untouched for flash-lite.
    expect(orderKeysByQuota({ keyCount: 2, model: FLASH, tallies })).toEqual([1]);
    expect(orderKeysByQuota({ keyCount: 2, model: LITE, tallies })).toEqual([0, 1]);
  });

  it("prefers the key with fewest successes today", () => {
    const tallies = talliesFrom([
      [LITE, 0, { ok: 9 }],
      [LITE, 1, { ok: 2 }],
      [LITE, 2, { ok: 5 }],
    ]);
    expect(orderKeysByQuota({ keyCount: 3, model: LITE, tallies })).toEqual([1, 2, 0]);
  });

  it("treats an unseen key as zero successes and puts it first", () => {
    const tallies = talliesFrom([[LITE, 0, { ok: 4 }]]);
    expect(orderKeysByQuota({ keyCount: 3, model: LITE, tallies })[0]).not.toBe(0);
  });

  it("returns an empty list when every key is spent — the caller must throw", () => {
    const tallies = talliesFrom([
      [FLASH, 0, { rateLimited: 3 }],
      [FLASH, 1, { rateLimited: 1 }],
    ]);
    expect(orderKeysByQuota({ keyCount: 2, model: FLASH, tallies })).toEqual([]);
  });

  it("rotates on ties so usage does not pile onto key 0", () => {
    const tallies = new Map<string, Tally>();
    expect(orderKeysByQuota({ keyCount: 3, model: LITE, tallies, cursor: 0 })).toEqual([0, 1, 2]);
    expect(orderKeysByQuota({ keyCount: 3, model: LITE, tallies, cursor: 1 })).toEqual([1, 2, 0]);
    expect(orderKeysByQuota({ keyCount: 3, model: LITE, tallies, cursor: 2 })).toEqual([2, 0, 1]);
  });

  it("falls back to plain order with no telemetry at all (the Vercel case)", () => {
    expect(
      orderKeysByQuota({ keyCount: 6, model: FLASH, tallies: new Map() })
    ).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("pinnedKeyIndex", () => {
  const original = process.env.GEMINI_KEY_INDEX;
  afterEach(() => {
    if (original === undefined) delete process.env.GEMINI_KEY_INDEX;
    else process.env.GEMINI_KEY_INDEX = original;
  });

  it("is null when unset or blank", () => {
    delete process.env.GEMINI_KEY_INDEX;
    expect(pinnedKeyIndex()).toBeNull();
    process.env.GEMINI_KEY_INDEX = "   ";
    expect(pinnedKeyIndex()).toBeNull();
  });

  it("reads a valid index", () => {
    process.env.GEMINI_KEY_INDEX = "1";
    expect(pinnedKeyIndex()).toBe(1);
  });

  it("rejects nonsense rather than silently using key 0", () => {
    process.env.GEMINI_KEY_INDEX = "second";
    expect(() => pinnedKeyIndex()).toThrow(/non-negative integer/);
    process.env.GEMINI_KEY_INDEX = "-1";
    expect(() => pinnedKeyIndex()).toThrow(/non-negative integer/);
  });
});

describe("Pacific-day accounting", () => {
  it("groups by Pacific calendar date, not UTC", () => {
    // 07:00Z on 8 Aug is still 8 Aug in UTC but 7 Aug in Pacific (PDT).
    expect(pacificDay("2026-08-08T07:00:00Z")).toBe("2026-08-08");
    expect(pacificDay("2026-08-08T06:59:00Z")).toBe("2026-08-07");
  });

  it("counts only events from the given Pacific day", () => {
    const events: QuotaEvent[] = [
      { ts: "2026-08-07T20:00:00Z", outcome: "success", role: "turn", model: LITE, keyIndex: 0 },
      { ts: "2026-08-08T05:00:00Z", outcome: "success", role: "turn", model: LITE, keyIndex: 0 },
      // past the reset boundary — a new day's budget
      { ts: "2026-08-08T08:00:00Z", outcome: "success", role: "turn", model: LITE, keyIndex: 0 },
    ];

    expect(tallyEvents(events, "2026-08-07")?.get(tallyKey(LITE, 0))?.ok).toBe(2);
    expect(tallyEvents(events, "2026-08-08")?.get(tallyKey(LITE, 0))?.ok).toBe(1);
  });

  it("records the reported limit alongside a 429", () => {
    const events: QuotaEvent[] = [
      {
        ts: "2026-08-07T20:00:00Z",
        outcome: "rate_limited",
        role: "planner",
        model: FLASH,
        keyIndex: 0,
        quotaLimit: "20",
        quotaMetric: "generativelanguage.googleapis.com/generate_content_free_tier_requests",
      },
    ];
    const t = tallyEvents(events, "2026-08-07").get(tallyKey(FLASH, 0));
    expect(t?.rateLimited).toBe(1);
    expect(t?.reportedLimit).toBe("20");
  });

  it("puts the next reset in the future", () => {
    const now = new Date("2026-08-07T21:00:00Z");
    const reset = nextQuotaReset(now);
    expect(reset.getTime()).toBeGreaterThan(now.getTime());
    expect(reset.getTime() - now.getTime()).toBeLessThanOrEqual(86_400_000);
    // and it lands on a Pacific midnight, i.e. the following Pacific day
    expect(pacificDay(reset)).not.toBe(pacificDay(now));
  });
});
