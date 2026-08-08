import { describe, expect, it } from "vitest";

import { shouldFollow, STICK_PX } from "./conversationScroll";

/**
 * The transcript stopped following the interview after one turn.
 *
 * The cause was WHERE this was measured, not the threshold: a layout effect
 * runs after React commits the new entry, so it read the post-insert height,
 * concluded the reader had scrolled away, and latched "not following" for the
 * rest of the session. The decision now comes from the reader's own scroll
 * events; this covers the arithmetic that decision uses.
 *
 * The layout itself is not testable here — vitest runs in `node`. That is
 * what the browser check is for.
 */
describe("shouldFollow", () => {
  const H = 600; // visible height
  const at = (scrollTop: number, content: number) => shouldFollow(scrollTop, content, H);

  it("follows when pinned to the bottom", () => {
    expect(at(2400, 3000)).toBe(true);
  });

  it("follows within the sticky margin", () => {
    expect(at(2400 - (STICK_PX - 1), 3000)).toBe(true);
  });

  it("lets go once the reader is clearly reading back", () => {
    expect(at(2400 - STICK_PX, 3000)).toBe(false);
    expect(at(0, 3000)).toBe(false);
  });

  it("follows when there is nothing to scroll", () => {
    // A short transcript must not be treated as "scrolled away".
    expect(at(0, 400)).toBe(true);
    expect(at(0, H)).toBe(true);
  });

  it("survives the overscroll browsers allow past the end", () => {
    expect(at(2500, 3000)).toBe(true);
  });
});
