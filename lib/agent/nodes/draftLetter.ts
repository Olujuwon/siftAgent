import type { SiftStateType } from "../state";

/**
 * NODE: draft_letter — final node, generates a cover letter OPENER.
 *
 * STUB. What it should do:
 *
 * - Write a short opener (an opening paragraph or two, not a full letter),
 *   using `jobText`, `resumeSummary`, `searchResults` and `fitScore.reasoning`.
 *
 * Style constraints, non-negotiable, they go in the prompt:
 *   - Short and direct. No filler, no "I am writing to express my interest".
 *   - No em dashes.
 *   - Accurate. Never claim experience that isn't in resumeSummary. Vue is a
 *     side-project only, not production experience, and the letter must not
 *     imply otherwise.
 *   - Specific: lean on something real from the research (their stack, a recent
 *     launch) rather than generic enthusiasm.
 *
 * Then -> END.
 */
export async function draftLetter(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  // TODO: build the prompt with the style rules above
  // TODO: call ChatAnthropic (plain string output is fine here)
  // TODO: return { letterDraft }
  throw new Error("draftLetter node not implemented");
}
