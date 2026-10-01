/**
 * PURPOSE
 * NODE `score_fit` — model judges the posting against the real stack.
 * Also holds `routeAfterScore`, the conditional edge's target selector.
 *
 * STATUS
 * Real: one Claude call with structured output when ANTHROPIC_API_KEY is set,
 * heuristic otherwise.
 *
 * EXPORTS
 * - scoreFit(state) -> Partial<state>              sets fitScore
 * - routeAfterScore(state) -> "research" | "draft_letter"
 *
 * ROUTING RULES — routeAfterScore, in this order
 * 1. attempts >= MAX_RESEARCH_ATTEMPTS  -> "draft_letter"  ALWAYS, no exceptions
 * 2. company is null                    -> "draft_letter"  nothing to research
 * 3. score uncertain, or research thin  -> "research"
 * 4. otherwise                          -> "draft_letter"
 *
 * NO HARDCODED STACK — DELIBERATE
 * An earlier draft listed the candidate's primary and secondary technologies
 * here. That's now wrong twice over: summarizeResume already classifies them
 * per-CV from actual evidence, and a hardcoded list would contradict it (it
 * did — on Python, Django and Java). It also only ever worked for one person.
 * Trust resumeSummary.
 *
 * GOTCHAS
 * - Check the attempts cap FIRST. Confidence never overrides it, or the graph
 *   can spin forever. This costs credits rather than throwing, so it fails
 *   quietly.
 * - fitScore needs to express uncertainty and research thinness, not just a
 *   number. Rule 3 is unimplementable otherwise.
 * - routeAfterScore is a PURE function of state. Keep it that way — it's the
 *   most valuable thing in the repo to unit test, and needs no model to do it.
 *
 * SKETCH
 *   expect(routeAfterScore({ ...state, attempts: MAX_RESEARCH_ATTEMPTS }))
 *     .toBe("draft_letter");
 */

import { createModel } from "@/lib/ai/model";
import { hasAnthropicKey } from "@/lib/config";
import { WORTH_APPLYING_SCORE } from "@/lib/constants";
import { fitScoreSchema } from "../state";
import { MAX_RESEARCH_ATTEMPTS } from "../state";
import type { SearchResult, SiftStateType } from "../state";
import type { FitScore } from "@/lib/types";

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

const SYSTEM_PROMPT = `You judge whether a job posting fits a specific engineer, for that engineer's own use in deciding whether to apply to THIS posting.

Judge the posting on its own merits. You are not ranking it against other
openings — you cannot see any — so do not hedge on the possibility of a better
match existing elsewhere.

The CANDIDATE section is a classified summary of their CV. Treat its structure
as authoritative:
- PRIMARY STACK is production experience. Weight it heavily.
- SECONDARY is side projects, training, or tools listed without context. Real,
  but much weaker evidence. A posting requiring a SECONDARY technology is a
  partial match, not a match.
- CAVEATS are binding. If it says a technology came from training only, the
  candidate does not have production experience in it. Never upgrade a caveated
  skill when matching.
- Anything absent from the summary is NOT experience. Do not infer it from
  adjacent skills.

The RESEARCH section is what was found about the company. It may be thin or
empty — that is information, not an excuse to guess. Note which angles were
searched: a topic that was searched and returned nothing is different from one
never searched, and only the latter belongs in researchGaps.

Scoring:
- score is 0-10 for how well the candidate fits THIS posting. ${WORTH_APPLYING_SCORE}+ means
  worth applying to.
- confidence reflects how much the evidence supports your score. Use "low" when
  the research did not tell you what you needed about the role or company.
- researchGaps names what you still need to know. Each entry should be
  answerable by a web search — it is used verbatim as the next search query.
  Leave it empty when you have enough.
- matched and missing hold the posting's requirements, quoted and TRIMMED to
  the essential phrase. One short line each, no explanation appended — the
  reasoning field is where explanation goes. At most six entries each; pick the
  ones that decide the outcome rather than listing everything.
- reasoning is two or three sentences grounded in matched and missing.

Be honest rather than encouraging. An inflated score wastes the candidate's
time on an application they will not win.`;

/**
 * Caps applied AFTER the model returns. The schema no longer rejects long
 * output — that discarded good answers — so these keep downstream consumers
 * bounded instead: the UI, and research, which uses researchGaps verbatim as
 * search queries. Trimming never fails a run; rejecting did.
 */
const LIMITS = { researchGaps: 3, matched: 6, missing: 6, queryChars: 150 } as const;

function trimFitScore(fitScore: FitScore): FitScore {
  return {
    ...fitScore,
    researchGaps: fitScore.researchGaps
      .slice(0, LIMITS.researchGaps)
      .map((gap) => gap.slice(0, LIMITS.queryChars)),
    matched: fitScore.matched.slice(0, LIMITS.matched),
    missing: fitScore.missing.slice(0, LIMITS.missing),
  };
}

/** Groups evidence by the query that found it, so gaps are distinguishable. */
function formatEvidence(evidence: SearchResult[]): string {
  if (evidence.length === 0) return "No research results yet.";

  const byAngle = new Map<string, SearchResult[]>();
  for (const result of evidence) {
    byAngle.set(result.queryAngle, [...(byAngle.get(result.queryAngle) ?? []), result]);
  }

  return [...byAngle.entries()]
    .map(([angle, results]) =>
      [
        `SEARCHED: ${angle}`,
        ...results.map((r) => `- ${r.title} (${r.url})\n  ${r.content}`),
      ].join("\n"),
    )
    .join("\n\n");
}

export async function scoreFit(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  if (!hasAnthropicKey) return demoScore(state);

  const evidence = state.searchResults
    .filter((result) => result.relevance > RELEVANCE_FLOOR)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, MAX_EVIDENCE);

  const anglesTried = [...new Set(state.searchResults.map((r) => r.queryAngle))];

  // A judgement call, not mechanical work — worth the higher effort.
  //
  // maxTokens 8000, not 3000: at 3000 the model ran out mid-JSON on a real
  // posting and the parse failed. Length is steered by the schema descriptions
  // and trimmed by trimFitScore afterwards; this is only the backstop, and a
  // generous one, because a truncated response costs the whole call.
  //
  // method: "jsonSchema" uses Anthropic's NATIVE structured output rather than
  // the default, which is forced tool calling. Forced tool calls are
  // incompatible with `thinking`, and the default path logs a warning saying so
  // on every call, then throws OutputParserException if the model happens not
  // to emit a tool call. Native JSON schema has no such conflict, and skips the
  // tool-calling overhead.
  const model = createModel({ maxTokens: 8000, effort: "high" }).withStructuredOutput(
    fitScoreSchema,
    { name: "fit_score", method: "jsonSchema" },
  );

  const fitScore = await model.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        `JOB POSTING:\n${state.jobText ?? "(missing)"}`,
        `CANDIDATE:\n${state.resumeSummary}`,
        state.company
          ? `RESEARCH on ${state.company} — ${state.attempts} pass(es), angles searched: ${anglesTried.join(" | ") || "none"}\n${formatEvidence(evidence)}`
          : "RESEARCH: none. The posting does not name its employer, so there was no company to research. Judge the role on the posting alone, and do not list company research in researchGaps.",
      ].join("\n\n---\n\n"),
    },
  ]);

  return { fitScore: trimFitScore(fitScore) };
}

/** Used when no ANTHROPIC_API_KEY is configured. See lib/config.ts. */
function demoScore(state: SiftStateType): Partial<SiftStateType> {
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

  // 2. No named employer, so research has nothing to find. Without this, low
  //    confidence would loop back to a research node that returns nothing,
  //    and score_fit would run again on identical input — up to the cap, at
  //    ~11s and real tokens each time.
  if (state.company === null) return "draft_letter";

  // 3. No score yet — shouldn't happen, since score_fit runs first. Research
  //    rather than draft a letter from nothing; rule 1 bounds the retries.
  const { fitScore } = state;
  if (!fitScore) return "research";

  // 4. Uncertain, or the model said what it still needs -> another angle.
  if (fitScore.confidence === "low" || fitScore.researchGaps.length > 0) {
    return "research";
  }

  return "draft_letter";
}
