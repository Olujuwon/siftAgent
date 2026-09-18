/**
 * PURPOSE
 * NODE `draft_letter` — final node. Generates a cover letter OPENER, then END.
 *
 * STATUS
 * STUB.
 *
 * EXPORTS
 * - draftLetter(state) -> Partial<state>   sets letterDraft
 *
 * STEPS
 * 1. Prompt with jobText + resumeSummary + searchResults + fitScore.reasoning.
 * 2. One model call, plain string output. No structured output needed.
 * 3. Return { letterDraft }.
 *
 * STYLE RULES — these go in the prompt, non-negotiable
 * - Short and direct. No "I am writing to express my interest".
 * - No em dashes.
 * - Accurate. Never claim experience absent from resumeSummary. Vue is
 *   side-project only, not production, and the letter must not imply otherwise.
 * - Specific. Lean on something real from the research (their stack, a recent
 *   launch), not generic enthusiasm.
 *
 * GOTCHAS
 * - An opener, not a full letter. One or two paragraphs.
 * - Inflating a side project into production experience is the default failure
 *   mode of this node. If it happens, that's the signal to make resumeSummary a
 *   structured object instead of a string, so caveats are data not prose.
 */

import { hasAnthropicKey } from "@/lib/config";
import type { SiftStateType } from "../state";

export async function draftLetter(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  if (hasAnthropicKey) {
    // TODO: prompt from jobText + resumeSummary + searchResults +
    // fitScore.reasoning, applying the style rules above. Plain string out.
    throw new Error("draftLetter: real model call not implemented yet");
  }

  return {
    letterDraft: `TODO: cover letter opener. Fit score ${state.fitScore?.score ?? "n/a"} after ${state.attempts} research pass(es).`,
  };
}
