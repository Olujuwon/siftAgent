/**
 * PURPOSE
 * Home page at `/`. Static shell; everything interactive is inside TriagePanel.
 *
 * STATUS
 * Plain shell. Real layout and styling come once the graph works.
 *
 * NO "use client" HERE — DELIBERATE
 * This is a Server Component. The client boundary starts at TriagePanel. If you
 * find yourself adding "use client" here, first check whether the state can live
 * one level deeper instead.
 */

import { TriagePanel } from "@/components/TriagePanel";

export default function Page() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">SiftAgent</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Paste a job posting URL or the posting text. You get back a fit score
          with reasoning, and a cover letter opener.
        </p>
      </div>
      <TriagePanel />
    </main>
  );
}
