import type { TriageResponse } from "@/lib/types";

/**
 * The output half of the UI: fit score, reasoning, and the letter draft.
 *
 * STUB.
 *
 * Note there is no "use client" here. This component only renders props — no
 * state, no effects, no event handlers — so it doesn't need to be a Client
 * Component. It gets rendered inside one (JobForm's parent holds the result
 * state), which is fine: a component without the directive adapts to wherever
 * it's used.
 *
 * Leave the directive off until something here actually needs interactivity —
 * a copy-to-clipboard button on the letter, say. Then add it.
 *
 * This is the piece Phase 2's /jobs page will reuse, which is why it's in
 * components/ rather than colocated in app/.
 *
 * What to implement:
 *
 * 1. Render the score. Once `FitScore` has real fields, show the number and the
 *    reasoning distinctly — the reasoning is the useful part, the number is just
 *    the sort key.
 * 2. Render `letterDraft` preserving line breaks. A <pre> or
 *    `white-space: pre-wrap` — plain <p> will collapse the paragraphs.
 * 3. Show `attempts`. It's how you can tell from the UI whether the research
 *    loop actually fired, which is part of the Phase 1 definition of done.
 * 4. A copy button on the letter would earn its keep fast. That would make this
 *    a Client Component.
 */

type TriageResultProps = {
  result: TriageResponse;
};

export function TriageResult({ result }: TriageResultProps) {
  // TODO: destructure { fitScore, letterDraft, attempts } and render each

  return (
    <section className="flex flex-col gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
      <h2 className="text-xl font-semibold tracking-tight">Result</h2>

      {/* TODO: fit score — the number */}
      {/* TODO: fit score — the reasoning */}
      {/* TODO: letter draft, preserving line breaks — `whitespace-pre-wrap` */}
      {/* TODO: research attempts, so the loop is visible */}

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Not implemented.
      </p>
    </section>
  );
}
