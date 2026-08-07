import { describe, expect, it } from "vitest";

import type { Claim } from "../types";
import {
  ANTI_INVENTION,
  filterInventedClaims,
  technicalTerms,
  verifyClaims,
} from "./shared";

const claim = (text: string, day = 28): Claim => ({ text, day, unjustified: true });

/** The exact words that produced the real fabrication. */
const HAND_WAVE =
  "Yeah, so we handle that. Kubernetes takes care of most of it really — " +
  "it's pretty good at rolling things safely. We set it up properly so " +
  "sessions keep working. I'd have to look at the config again to remember " +
  "the exact details but it was handled.";

describe("the real failure case", () => {
  it('"we set it up properly" must NOT support a termination grace period claim', () => {
    const invented = claim(
      "configured termination grace period to handle active streaming sessions during pod rotation"
    );
    const [check] = verifyClaims([invented], HAND_WAVE);

    expect(check.supported).toBe(false);
    expect(check.unsupportedTerms).toContain("termination grace period");
  });

  it("drops that claim rather than letting it reach the ledger", () => {
    const { kept, rejected } = filterInventedClaims(
      [
        claim("configured termination grace period for streaming sessions"),
        claim("says Kubernetes handles it and sessions keep working"),
      ],
      HAND_WAVE
    );

    expect(kept).toHaveLength(1);
    expect(kept[0].text).toMatch(/sessions keep working/);
    expect(rejected).toHaveLength(1);
  });

  it("accepts the faithful paraphrase of the same hand-wave", () => {
    const faithful = claim(
      "asserts Kubernetes handles rolling safely and sessions keep working, with no detail"
    );
    expect(verifyClaims([faithful], HAND_WAVE)[0].supported).toBe(true);
  });
});

describe("verifyClaims", () => {
  const SOURCE =
    "We build a container image in CI and push it to the registry, then apply " +
    "the updated manifest so Kubernetes rolls the pods. There's a readiness " +
    "probe so traffic only shifts once the new pods answer health checks.";

  it("accepts a technical term the candidate actually used", () => {
    expect(
      verifyClaims([claim("uses a readiness probe to gate traffic")], SOURCE)[0]
        .supported
    ).toBe(true);
  });

  it("rejects a neighbouring term they did not use", () => {
    const check = verifyClaims(
      [claim("uses connection draining and sticky sessions")],
      SOURCE
    )[0];
    expect(check.supported).toBe(false);
    expect(check.unsupportedTerms).toEqual(
      expect.arrayContaining(["connection draining", "sticky session"])
    );
  });

  it("allows ordinary paraphrase in plain English", () => {
    // None of these words are policed vocabulary.
    expect(
      verifyClaims([claim("they ship a new build and swap it in gradually")], SOURCE)[0]
        .supported
    ).toBe(true);
  });

  it("tolerates simple plurals in either direction", () => {
    expect(
      verifyClaims([claim("relies on health check endpoints")], SOURCE)[0].supported
    ).toBe(true);
  });

  it("treats an empty claim list as trivially supported", () => {
    expect(filterInventedClaims([], SOURCE).kept).toEqual([]);
    expect(filterInventedClaims([], SOURCE).rejected).toEqual([]);
  });
});

describe("glossary", () => {
  it("is seeded from the curriculum's own tools", () => {
    const terms = technicalTerms();
    expect(terms).toContain("docker");
    expect(terms).toContain("kubernetes");
  });

  it("prefers longer phrases so they match before their fragments", () => {
    const terms = technicalTerms();
    const long = terms.indexOf("termination grace period");
    const short = terms.indexOf("grace period");
    expect(long).toBeGreaterThanOrEqual(0);
    expect(long).toBeLessThan(short);
  });
});

describe("ANTI_INVENTION", () => {
  it("carries both real failures as worked examples", () => {
    expect(ANTI_INVENTION).toContain("passed it on a standard attempt");
    expect(ANTI_INVENTION).toContain("termination grace period");
  });

  it("is shared by every prompt that builds a structured record", async () => {
    const { PLANNER_SYSTEM } = await import("./planner");
    const { TURN_SYSTEM } = await import("./turn");
    expect(PLANNER_SYSTEM).toContain(ANTI_INVENTION);
    expect(TURN_SYSTEM).toContain(ANTI_INVENTION);
  });
});
