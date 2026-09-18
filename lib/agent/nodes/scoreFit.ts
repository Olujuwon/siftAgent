/**
 * PURPOSE
 * NODE `score_fit` — model judges the posting against the real stack.
 * Also holds `routeAfterScore`, the conditional edge's target selector.
 *
 * STATUS
 * scoreFit is a HEURISTIC placeholder — no model call yet. It exists to drive
 * the conditional edge deterministically while the graph is being wired.
 * routeAfterScore is still a stub.
 *
 * EXPORTS
 * - scoreFit(state) -> Partial<state>              sets fitScore
 * - routeAfterScore(state) -> "research" | "draft_letter"
 *
 * TODO — replace the heuristic with a real model call
 * 1. Prompt with jobText + resumeSummary + accumulated searchResults, grouped
 *    by queryAngle so "we searched and found nothing" is distinguishable from
 *    "we never searched".
 * 2. Use withStructuredOutput(fitScoreSchema) so the result is validated, not
 *    parsed out of prose.
 * 3. Include the pass count and angles tried — researchGaps is meaningless
 *    without them.
 * 4. Return { fitScore }. Do NOT touch `attempts`; research owns that counter.
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

import { hasAnthropicKey } from "@/lib/config";
import { MAX_RESEARCH_ATTEMPTS } from "../state";
import type { SearchResult, SiftStateType } from "../state";

/** Results below this are dropped before they'd reach the prompt. */
export const RELEVANCE_FLOOR = 0.6;

/** How many results the prompt will carry once there is a prompt. */
export const MAX_EVIDENCE = 8;

/**
 * HEURISTIC placeholder. Confidence rises with how many DISTINCT angles the
 * research covered — not with how many results came back, since three hits
 * from one query is still one angle's worth of evidence.
 *
 * TODO: delete once the model returns confidence itself.
 */
function estimateConfidence(evidence: SearchResult[]): "low" | "medium" | "high" {
  const angles = new Set(evidence.map((r) => r.queryAngle));
  if (angles.size <= 1) return "low";
  if (angles.size === 2) return "medium";
  return "high";
}

export async function scoreFit(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  if (hasAnthropicKey) {
    // TODO: prompt with jobText + resumeSummary + evidence grouped by
    // queryAngle, then withStructuredOutput(fitScoreSchema).
    throw new Error("scoreFit: real model call not implemented yet");
  }

  const evidence = state.searchResults
    .filter((result) => result.relevance > RELEVANCE_FLOOR)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, MAX_EVIDENCE);

  const anglesCovered = [...new Set(evidence.map((r) => r.queryAngle))];
  const confidence = estimateConfidence(evidence);

  // TODO: the model decides all of this. Until then the score is a stand-in
  // that rises with research coverage — it says nothing about actual fit.
  const score = Math.min(10, anglesCovered.length * 3);

  return {
    fitScore: {
      score,
      confidence,
      // Non-empty while confidence is low, so routeAfterScore has something to
      // branch on and research has a next query. TODO: the model supplies these.
      researchGaps:
        confidence === "high"
          ? []
          : ["Not enough distinct research angles covered yet."],
      matched: [], // TODO: model — requirements met, quoted from the posting
      missing: [], // TODO: model — requirements not met
      reasoning: `Heuristic placeholder: ${evidence.length} result(s) across ${anglesCovered.length} angle(s) [${anglesCovered.join(", ")}]. No model call yet.`,
    },
  };
}

/**
 * The conditional edge's target selector. Pure — no model, no I/O — so it is
 * the cheapest thing in the repo to unit test, and the most valuable.
 *
 * Order matters. The cap is checked FIRST and confidence never overrides it:
 * a loop that ignores the cap doesn't crash, it quietly spends API credits
 * until LangGraph's recursion limit stops it.
 */
export function routeAfterScore(
  state: SiftStateType,
): "research" | "draft_letter" {
  // 1. Cap wins over everything.
  if (state.attempts >= MAX_RESEARCH_ATTEMPTS) return "draft_letter";

  // 2. No score yet — shouldn't happen, since score_fit runs first. Research
  //    rather than draft a letter from nothing; rule 1 bounds the retries.
  const { fitScore } = state;
  if (!fitScore) return "research";

  // 3. Uncertain, or the model said what it still needs -> another angle.
  if (fitScore.confidence === "low" || fitScore.researchGaps.length > 0) {
    return "research";
  }

  return "draft_letter";
}
