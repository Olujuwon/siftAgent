import type { SiftStateType } from "../state";

/**
 * NODE: score_fit — model judges the posting against the real stack.
 *
 * STUB. What it should do:
 *
 * - Prompt Claude with `jobText` + `resumeSummary` + accumulated
 *   `searchResults`, and ask for a structured verdict.
 * - Use `withStructuredOutput(fitScoreSchema)` (zod, from state.ts) so the
 *   result is validated rather than parsed out of prose.
 * - Ground the judgement in the ACTUAL stack, primary vs secondary:
 *     primary   — React, Next.js, TypeScript, Node.js, Python, Django
 *     secondary — React Native, Laravel, testing frameworks
 *   Anything not on that list is not experience. The model must not inflate.
 * - Signal its own uncertainty, and whether the research was thin. The
 *   conditional edge downstream needs something concrete to branch on — a bare
 *   number can't distinguish "confidently a bad fit" from "no idea yet".
 */
export async function scoreFit(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  // TODO: build the prompt (job requirements + resume + research)
  // TODO: const model = new ChatAnthropic({ ... }).withStructuredOutput(fitScoreSchema)
  // TODO: return { fitScore }
  throw new Error("scoreFit node not implemented");
}

/**
 * CONDITIONAL EDGE target selector for after score_fit.
 *
 * STUB. Routing rules:
 *
 * - `attempts >= MAX_RESEARCH_ATTEMPTS` -> "draft_letter", ALWAYS. The cap wins
 *   over confidence, no exceptions, or the graph can loop forever.
 * - score is uncertain, or research was thin -> "research" (new query angle).
 * - otherwise -> "draft_letter".
 *
 * Keep this a pure function of state — easy to unit test without a model, and
 * it's the piece of the graph most worth testing.
 */
export function routeAfterScore(
  state: SiftStateType,
): "research" | "draft_letter" {
  // TODO: check the attempts cap FIRST
  // TODO: then decide on confidence / research depth
  throw new Error("routeAfterScore not implemented");
}
