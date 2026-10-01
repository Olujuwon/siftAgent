/**
 * PURPOSE
 * The output half of the UI: fit score, reasoning, letter draft.
 *
 * NO "use client" HERE — DELIBERATE
 * This renders props only, so it stays a Server Component. The copy button IS
 * interactive, and the instinct is to add "use client" for it — don't, that ships
 * this whole component to the browser for one button. It lives in CopyButton
 * instead. Pattern: when one child needs interactivity, extract the child rather
 * than promoting the parent.
 *
 * Reused by Phase 2's /jobs page, which is why it's in components/.
 *
 * GOTCHAS
 * - letterDraft needs whitespace-pre-wrap or its paragraph breaks collapse.
 * - `attempts` is how the research loop becomes visible without reading JSON —
 *   part of the Phase 1 definition of done. Don't hide it.
 * - Adding a handler here would force "use client". Put it in a child instead.
 */

import type { FitScore, TriageResponse } from "@/lib/types";
import { LetterSection } from "@/components/LetterSection";
import { ResearchModal } from "@/components/ResearchModal";
import { WORTH_APPLYING_SCORE } from "@/lib/constants";

type TriageResultProps = {
  result: TriageResponse;
};

/**
 * WORTH_APPLYING_SCORE is the threshold the scoring prompt is told about.
 * Stated here so the UI reaches the same conclusion the model was asked for,
 * rather than leaving the reader to map a number onto a decision.
 *
 * Not rendered as a percentage on purpose. The score is an integer 0-10, so
 * only 0%, 10%, 20%… exist — two digits would imply a precision the scale
 * cannot produce, and "of what?" has no answer.
 */
function verdictFor(score: number): { label: string; className: string } {
  if (score >= WORTH_APPLYING_SCORE) {
    return {
      label: "Worth applying",
      className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    };
  }
  if (score >= 4) {
    return {
      label: "Marginal",
      className: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    };
  }
  return {
    label: "Poor fit",
    className: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  };
}

const CONFIDENCE_STYLES: Record<FitScore["confidence"], string> = {
  low: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  medium: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  high: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
};

/** Shared list rendering for matched / missing / researchGaps. */
function Findings({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h4>
      <ul className="list-inside list-disc text-sm text-gray-700 dark:text-gray-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function TriageResult({ result }: TriageResultProps) {
  const { fitScore, letterDraft, threadId, attempts, company, searchResults, timings, durationMs } =
    result;
  const verdict = verdictFor(fitScore.score);

  return (
    <section className="flex flex-col gap-6 border-t border-gray-200 pt-6 dark:border-gray-800">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Fit</h2>
          <ResearchModal
            company={company}
            searchResults={searchResults}
            timings={timings}
            durationMs={durationMs}
            attempts={attempts}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-3xl font-semibold tabular-nums">
            {fitScore.score}
            <span className="text-base font-normal text-gray-500">/10</span>
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${verdict.className}`}
          >
            {verdict.label}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${CONFIDENCE_STYLES[fitScore.confidence]}`}
          >
            {fitScore.confidence} confidence
          </span>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300">
          {fitScore.reasoning}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Findings title="Matched" items={fitScore.matched} />
        <Findings title="Missing" items={fitScore.missing} />
        <Findings title="Still unknown" items={fitScore.researchGaps} />
      </div>

      {/* key: a new triage remounts it, so a drafted letter doesn't carry over. */}
      <LetterSection
        key={threadId}
        initialDraft={letterDraft}
        threadId={threadId}
        score={fitScore.score}
      />
    </section>
  );
}
