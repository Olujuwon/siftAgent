"use client";

/**
 * PURPOSE
 * Resume PDF upload, plus a view of the stored summary.
 *
 * STATUS
 * STUB. NOT MOUNTED — nothing renders this yet. Wiring it in means editing
 * app/page.tsx or TriagePanel.tsx, which is your layout call.
 * Suggested spot: above <JobForm /> in TriagePanel, since a missing resume
 * blocks triage.
 *
 * STEPS
 * 1. On mount, GET /api/resume to load current state.
 * 2. <input type="file" accept="application/pdf">
 * 3. On submit: build FormData, append the file, POST it.
 * 4. Loading state — PDF parse plus a model call. Reuse JobForm's Loader2.
 * 5. Render the stored summary as readable text, plus updatedAt.
 * 6. Errors via <ErrorComponent message onDismiss />.
 *
 * GOTCHAS
 * - Do NOT set a Content-Type header on the POST. The browser must set it, to
 *   include the multipart boundary. Setting it manually is the classic way to
 *   get an unhelpful parse failure.
 * - ResumeStatusResponse is a discriminated union — check `hasResume` before
 *   reading `summary`.
 * - `accept` only filters the file picker. The server still validates.
 * - Show the summary text, not a "resume uploaded ✓" badge. Reading it is how a
 *   hallucinated summary gets caught before it skews every triage.
 * - Show updatedAt. A summary from an outdated resume is the quiet failure here.
 * - Distinct copy per status: 400 (not a PDF / no text layer), 413 (too large),
 *   502 (model failed). A scanned resume is a common real case — name it.
 *
 * SKETCH
 *   const formData = new FormData();
 *   formData.append("file", file);
 *   await fetch("/api/resume", { method: "POST", body: formData });
 */

import type { ResumeStatusResponse } from "@/lib/types";

type ResumeUploadProps = {
  /** Called after a successful upload, so a parent can unblock the form. */
  onUploaded?: (status: ResumeStatusResponse) => void;
};

export function ResumeUpload({ onUploaded }: ResumeUploadProps) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-gray-300 p-4 dark:border-gray-700">
      <h2 className="text-sm font-medium">Resume</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Not implemented.
      </p>
    </section>
  );
}
