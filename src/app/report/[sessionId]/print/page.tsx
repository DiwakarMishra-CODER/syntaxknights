import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportPrint } from "@/components/ReportPrint";
import { PrintTrigger } from "@/components/PrintTrigger";
import { loadReportView } from "@/lib/report-page";

export const dynamic = "force-dynamic";

/**
 * The printable report, at its own URL.
 *
 * Separate from /report/[sessionId] because that page unmounts its inactive
 * tabs — printing it would silently capture a third of the report. This route
 * renders everything in one flow and is styled light-only, since the app
 * defaults to dark and paper is not.
 */
export default async function PrintReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const data = await loadReportView(sessionId);

  if (data.status === "missing") notFound();

  if (data.status !== "ready") {
    return (
      <main className="pr-page">
        <p className="pr-body">
          {data.status === "in_progress"
            ? "This interview is still in progress."
            : "The report is still being written. Try again in a few seconds."}
        </p>
        <Link href={`/report/${sessionId}`} className="pr-back">
          ← Back to the report
        </Link>
      </main>
    );
  }

  // Stamped on the server at request time. The component takes it as a prop
  // rather than calling Date itself so it stays a pure render.
  const generatedOn = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="pr-page">
      <div className="pr-toolbar">
        <Link href={`/report/${sessionId}`} className="pr-back">
          ← Back to the report
        </Link>
        <PrintTrigger />
      </div>

      <ReportPrint
        feedback={data.feedback}
        panel={data.panel}
        turns={data.turns}
        focusDays={data.focusDays}
        candidate={data.candidate}
        endedEarly={data.endedEarly}
        sessionId={sessionId}
        generatedOn={generatedOn}
      />
    </main>
  );
}
