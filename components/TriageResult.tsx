import type { TriageResponse } from "@/lib/types";
import { CopyButton } from "@/components/CopyButton";

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
 * The copy button IS interactive, and the instinct would be to add "use client"
 * here to accommodate it. Don't — that would ship this whole component to the
 * browser for the sake of one button. It lives in its own Client Component
 * (CopyButton) instead, so only the button crosses the boundary.
 *
 * That's the pattern worth internalising: when one child needs interactivity,
 * extract the child rather than promoting the parent.
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
      {/* TODO: research attempts, so the loop is visible */}

      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">Cover letter opener</h3>
        {/* TODO: pass result.letterDraft once it's populated */}
        <CopyButton value="" label="Copy letter" />
      </div>

      {/* TODO: render result.letterDraft here — keep `whitespace-pre-wrap`
          or the paragraph breaks collapse. */}
      <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
        Not implemented.
      </p>
    </section>
  );
}
