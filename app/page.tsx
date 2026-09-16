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
    // h-full fills the body shell. min-h-0 is the critical one: without it a
    // flex child refuses to shrink below its content, so inner panes can never
    // scroll and the whole layout overflows instead.
    <main className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-5 px-5 py-6 sm:px-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">SiftAgent</h1>
        <p className="text-sm text-gray-500">
          Paste a posting. Get a fit score and a cover letter opener.
        </p>
      </header>

      <TriagePanel />
    </main>
  );
}
