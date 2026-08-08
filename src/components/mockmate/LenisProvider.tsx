"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth scrolling for the marketing page ONLY.
 *
 * Lenis works by calling preventDefault() on every wheel event and animating
 * the document's scroll position itself. That is fine on a long marketing
 * page, which is one tall scrolling document. It is fatal on the interview
 * screen, which is a fixed-height split view whose two columns scroll
 * internally: the document does not scroll, so Lenis swallowed the wheel and
 * nothing moved. Both panes were scrollable the whole time — measured
 * scrollTop could be set programmatically and took effect — but no wheel
 * event ever reached them.
 *
 * So it is scoped by route rather than left global.
 */

/** Routes that are one long scrolling document. Everything else is app UI. */
const SMOOTH_SCROLL_ROUTES = ["/"];

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const enabled = SMOOTH_SCROLL_ROUTES.includes(pathname);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // The frame handle has to be captured and cancelled. The previous version
    // called lenis.destroy() but left the loop running, so it went on calling
    // raf() on a destroyed instance for the life of the tab.
    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [enabled]);

  return <>{children}</>;
}
