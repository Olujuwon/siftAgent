/**
 * PURPOSE
 * The output half of the UI: fit score, reasoning, letter draft.
 *
 * STATUS
 * STUB.
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
 * STEPS
 * 1. Render the score and the reasoning distinctly — reasoning is the useful
 *    part, the number is just a sort key.
 * 2. Render letterDraft with whitespace-pre-wrap.
 * 3. Show attempts.
 * 4. Pass letterDraft to <CopyButton value={...} />.
 *
 * GOTCHAS
 * - A plain <p> collapses the letter's paragraph breaks. Keep
 *   `whitespace-pre-wrap`.
 * - `attempts` is how the research loop becomes visible in the UI, which is part
 *   of the Phase 1 definition of done.
 * - Adding a handler here would force "use client". Put it in a child instead.
 */

import type { TriageResponse } from "@/lib/types";
import { CopyButton } from "@/components/CopyButton";

type TriageResultProps = {
  result: TriageResponse;
};

export function TriageResult({ result }: TriageResultProps) {
  return (
    <section className="flex flex-col gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
      <h2 className="text-xl font-semibold tracking-tight">Result</h2>

      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">Cover letter opener</h3>
        <CopyButton value="" label="Copy letter" />
      </div>

      <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
        Not implemented.
      </p>
    </section>
  );
}
