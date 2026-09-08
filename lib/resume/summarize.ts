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

export async function summarizeResume(resumeText: string): Promise<string> {
  throw new Error("summarizeResume not implemented");
}
