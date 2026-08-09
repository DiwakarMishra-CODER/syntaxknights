"use client";

import { useEffect } from "react";

/**
 * The print button on the print page.
 *
 * Also fires automatically on first load when arrived at with ?auto=1, so the
 * "Download PDF" link from the report is one click rather than two. Guarded
 * against firing twice under React strict mode's double-effect.
 */
export function PrintTrigger() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!new URLSearchParams(window.location.search).has("auto")) return;

    let fired = false;
    // One frame, so fonts and layout have settled before the dialog snapshots.
    const id = window.setTimeout(() => {
      if (fired) return;
      fired = true;
      window.print();
    }, 350);

    return () => window.clearTimeout(id);
  }, []);

  return (
    <button type="button" onClick={() => window.print()} className="pr-print-btn">
      Save as PDF
    </button>
  );
}
