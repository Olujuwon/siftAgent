/**
 * PURPOSE
 * NODE `score_fit` — model judges the posting against the real stack.
 * Also holds `routeAfterScore`, the conditional edge's target selector.
 *
 * STATUS
 * STUB. Both functions.
 *
 * EXPORTS
 * - scoreFit(state) -> Partial<state>              sets fitScore
 * - routeAfterScore(state) -> "research" | "draft_letter"
 *
 * STEPS — scoreFit
 * 1. Prompt with jobText + resumeSummary + accumulated searchResults.
 * 2. Use withStructuredOutput(fitScoreSchema) so the result is validated, not
 *    parsed out of prose.
 * 3. Return { fitScore }.
 *
 * ROUTING RULES — routeAfterScore, in this order
 * 1. attempts >= MAX_RESEARCH_ATTEMPTS  -> "draft_letter"  ALWAYS, no exceptions
 * 2. score uncertain, or research thin  -> "research"
 * 3. otherwise                          -> "draft_letter"
 *
 * THE REAL STACK — ground the judgement in this, don't let the model inflate
 * - primary:   React, Next.js, TypeScript, Node.js, Python, Django
 * - secondary: React Native, Laravel, testing frameworks
 * - anything not listed is NOT experience
 *
 * GOTCHAS
 * - Check the attempts cap FIRST. Confidence never overrides it, or the graph
 *   can spin forever. This costs credits rather than throwing, so it fails
 *   quietly.
 * - fitScore needs to express uncertainty and research thinness, not just a
 *   number. Rule 2 is unimplementable otherwise.
 * - routeAfterScore is a PURE function of state. Keep it that way — it's the
 *   most valuable thing in the repo to unit test, and needs no model to do it.
 *
 * SKETCH
 *   expect(routeAfterScore({ ...state, attempts: MAX_RESEARCH_ATTEMPTS }))
 *     .toBe("draft_letter");
 */

import type { SiftStateType } from "../state";

export async function scoreFit(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  throw new Error("scoreFit node not implemented");
}

export function routeAfterScore(
  state: SiftStateType,
): "research" | "draft_letter" {
  throw new Error("routeAfterScore not implemented");
}
