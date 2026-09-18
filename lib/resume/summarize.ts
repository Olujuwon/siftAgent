/**
 * PURPOSE
 * Turn raw resume text into the `resumeSummary` string the graph consumes.
 * Runs ONCE per resume, in the upload route — NOT as a graph node.
 *
 * STATUS
 * STUB.
 *
 * EXPORTS
 * - summarizeResume(resumeText) -> string
 *
 * STEPS
 * 1. One ChatAnthropic call. Plain string output — resumeSummary is a string.
 * 2. Prompt must preserve primary vs secondary stack, and caveats, verbatim.
 * 3. Forbid invention. Omission is fine; embellishment is not.
 * 4. Strip contact details (name, address, phone, email).
 *
 * MUST SURVIVE SUMMARIZATION
 * - primary:   React, Next.js, TypeScript, Node.js, Python, Django
 * - secondary: React Native, Laravel, testing frameworks
 * - caveats:   "Vue: side projects only, no production experience"
 *
 * GOTCHAS
 * - Not a node, by design. Your resume changes twice a year; a posting changes
 *   every run. A node here = one model call per triage for identical output.
 * - Instruct the model to carry caveats forward VERBATIM, not paraphrase. A
 *   summary that flattens "side project" into "experience with Vue" has put a
 *   lie into every cover letter you send.
 * - score_fit weights primary vs secondary differently, so a summary that loses
 *   the distinction can't be recovered downstream.
 * - Stripping contact details here means they never reach the provider on later
 *   triage calls either.
 * - Because output is a plain string, caveats survive only as prose the
 *   downstream prompts re-read each run. If draft_letter claims production Vue
 *   anyway, revisit making this a structured object.
 */

import "server-only";

import { hasAnthropicKey } from "@/lib/config";

/**
 * FAKE. Returns a realistic summary rather than a placeholder string, on
 * purpose: score_fit will eventually judge a real posting against whatever is
 * stored here. "fake summary" would produce nonsense fit scores and you'd burn
 * a real model call working out why.
 *
 * It carries the three things the real version must preserve — primary stack,
 * secondary stack, and caveats stated explicitly.
 *
 * TODO: replace with one ChatAnthropic call. Prompt must:
 * - carry caveats forward VERBATIM, not paraphrased. A summary that flattens
 *   "side project" into "experience with Vue" puts a lie in every cover letter
 * - keep primary vs secondary distinct — score_fit weights them differently
 * - forbid invention: omission is fine, embellishment is not
 * - strip contact details, so they never reach the provider on later calls
 */
export async function summarizeResume(resumeText: string): Promise<string> {
  if (hasAnthropicKey) {
    // TODO: one ChatAnthropic call, per the rules above. Plain string out — no
    // structured output needed, since resumeSummary is a string in state.
    throw new Error("summarizeResume: real model call not implemented yet");
  }

  return demoSummary(resumeText);
}

/** Used when no ANTHROPIC_API_KEY is configured. See lib/config.ts. */
function demoSummary(resumeText: string): string {
  const wordCount = resumeText.trim().split(/\s+/).length;

  return [
    "PRIMARY STACK (production experience): React, Next.js, TypeScript, Node.js, Python, Django.",
    "SECONDARY (working knowledge): React Native, Laravel, testing frameworks.",
    "CAVEATS: Vue is side-project only — no production experience.",
    "Senior full-stack engineer. Comfortable owning frontend architecture, REST API design, and CI/CD.",
    `[demo mode — ${wordCount} words received, but no model was called]`,
  ].join("\n");
}
