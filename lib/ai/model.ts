/**
 * PURPOSE
 * One place that builds the Claude client, so model choice and defaults don't
 * drift across summarizeResume, scoreFit and draftLetter.
 *
 * MODEL
 * claude-opus-5. Don't downgrade for cost without measuring — effort is the
 * cheaper lever, and it's per-call (see below).
 *
 * EFFORT
 * Trades thoroughness against tokens within the same model:
 *   low     extraction, summarising — mechanical work
 *   medium  default here
 *   high    the API default; judgement calls
 *   xhigh / max  correctness matters more than cost
 *
 * THINKING
 * Adaptive: Claude decides when and how much to think. The older
 * `budget_tokens` form is gone on this model. Output is `omitted` by default,
 * so nothing extra comes back unless you ask for a summary.
 *
 * GOTCHAS
 * - Built per call, not at module load. A module-level client would capture the
 *   key at import time, and it would also construct on the demo deployment
 *   where there is no key at all.
 * - maxTokens is a hard ceiling the model can't see. Too low truncates
 *   mid-sentence and you pay for the wasted output. It is also the ONLY length
 *   limit on the summariser — its prompt carries no word count, so this number
 *   is what stops a runaway.
 */

import "server-only";

import { ChatAnthropic } from "@langchain/anthropic";

export const MODEL = "claude-opus-5";

type ModelOptions = {
  /** Hard ceiling on output tokens. */
  maxTokens: number;
  /** Lower for mechanical work, higher when the judgement is the point. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
};

export function createModel({ maxTokens, effort = "medium" }: ModelOptions) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Should be unreachable — callers check hasAnthropicKey first. Explicit so
    // a missing key fails here rather than as a confusing 401 mid-graph.
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  return new ChatAnthropic({
    apiKey,
    model: MODEL,
    maxTokens,
    thinking: { type: "adaptive" },
    outputConfig: { effort },
  });
}
