import { TriagePanel } from "@/components/TriagePanel";

/**
 * Home page at `/`.
 *
 * This is a Server Component — note the absence of "use client". It renders the
 * static shell; everything interactive lives inside `<TriagePanel />`, which is
 * the client boundary.
 *
 * Keeping the directive off this file is the point. If you find yourself adding
 * "use client" here, first check whether the state can live one level deeper
 * instead.
 *
 * Deliberately left as a plain shell. Once the graph works end to end, this is
 * where real layout and styling go.
 */
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
