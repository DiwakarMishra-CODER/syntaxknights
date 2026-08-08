/**
 * Should the transcript follow the newest turn?
 *
 * Kept out of the component for the same reason as traceGeometry.ts: a plain
 * module can be tested directly, a .tsx one cannot be imported from a .ts
 * test. The layout this feeds is not testable here — that is what the browser
 * check is for — but the decision it makes is.
 */

/** How close to the bottom still counts as "following along". */
export const STICK_PX = 120;

export function shouldFollow(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
): boolean {
  return scrollHeight - scrollTop - clientHeight < STICK_PX;
}
