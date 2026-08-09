"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-renders the report page until the report row appears.
 *
 * The page is a server component reading `loadReport`, and the report is
 * written by a different request. Until now a miss printed "refresh in a few
 * seconds" and left it to the reader — so a report finished half a second
 * later still looked like it had never arrived.
 *
 * It gives up rather than polling forever, because a miss is not always
 * transient: `persistReport` swallows its DB errors so an interview can
 * legitimately finish with no report row, and spinning on that would be a
 * permanent lie. When the attempts run out the caller's static copy is shown.
 */
export function ReportPoller({
  intervalMs = 2000,
  maxAttempts = 15,
}: {
  intervalMs?: number;
  maxAttempts?: number;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt >= maxAttempts) return;

    const id = setTimeout(() => {
      setAttempt((n) => n + 1);
      // If the report has landed, this render resolves to the real page and
      // this component unmounts. If not, the effect runs again.
      router.refresh();
    }, intervalMs);

    return () => clearTimeout(id);
  }, [attempt, intervalMs, maxAttempts, router]);

  const givenUp = attempt >= maxAttempts;

  return (
    <p
      className="text-xs font-mono text-[var(--app-muted)]"
      role="status"
      aria-live="polite"
    >
      {givenUp
        ? "Still not ready. Refresh to try again."
        : "Checking for your report..."}
    </p>
  );
}
