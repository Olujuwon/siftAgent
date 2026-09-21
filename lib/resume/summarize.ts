/**
 * PURPOSE
 * Turn raw resume text into the `resumeSummary` string the graph consumes.
 * Runs ONCE per resume, in the upload route — NOT as a graph node.
 *
 * STATUS
 * Real: one Claude call when ANTHROPIC_API_KEY is set, canned summary otherwise.
 *
 * EXPORTS
 * - summarizeResume(resumeText) -> string
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

import { createModel } from "@/lib/ai/model";
import { hasAnthropicKey } from "@/lib/config";

const SYSTEM_PROMPT = `You compress a CV into a summary that a job-fit scorer will read.

Your value is CLASSIFICATION, not transcription. The scorer could read the CV
itself; what it cannot do is work out which technologies are production
experience and which are not. That judgement is the whole job.

Produce exactly these sections, in this order, and no others:

1. PROFILE — two sentences. Current title, years of experience, location.
2. ROLES — one line each: title, company, dates, and the single most
   substantial thing done there. Newest first.
3. PRIMARY STACK — technologies used in paid professional work. One list.
4. SECONDARY — everything else the CV names: side projects, training, course
   work, tools listed without context. One list.
5. CAVEATS — every qualifier the CV makes about depth, stated VERBATIM. If it
   says a technology was side-project or training only, say that. Flattening
   "side project" into "experience with X" puts a falsehood into every cover
   letter generated from this summary.

Rules:
- Never invent. If the CV does not mention something, neither do you.
- Every technology the CV names must appear in PRIMARY or SECONDARY — exactly
  once, in whichever fits. The scorer can only match against what survives
  here, so a dropped skill is a job you silently stop matching. A technology
  repeated in both lists is a bug.
- When you are unsure whether the CV supports a claim, leave it out rather than
  guessing. A missing skill costs a match; an invented one costs trust.
- Do NOT reproduce the CV's own section headings or bullet structure. No
  per-role bullet lists, no "skills as listed" dump. Reorganise into the five
  sections above.
- Do not include contact details: no name, address, phone or email. They serve
  no purpose in a fit judgement and should not travel further.
- Plain text, no markdown.
- Be substantially shorter than the CV — roughly half its length. Prefer
  completeness of TECHNOLOGIES over completeness of prose: keep every skill,
  cut the narrative around it.`;

export async function summarizeResume(resumeText: string): Promise<string> {
  if (!hasAnthropicKey) return demoSummary(resumeText);

  // 4000, not 2000: a dense technical CV tokenises far worse than prose, and
  // 2000 truncated a real one mid-section — silently, since a truncated summary
  // still looks like a summary. The prompt is what controls length; this is
  // only the backstop.
  const model = createModel({ maxTokens: 4000, effort: "low" });

  const response = await model.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `CV:\n\n${resumeText}` },
  ]);

  // .text is the concatenated text blocks. Thinking blocks are omitted by
  // default, so this is just the summary.
  const summary = response.text.trim();
  if (summary === "") {
    throw new Error("The model returned an empty summary.");
  }
  return summary;
}

/**
 * Used when no ANTHROPIC_API_KEY is configured. Deliberately realistic rather
 * than "fake summary": score_fit judges real postings against whatever is
 * stored here, and a placeholder would produce nonsense scores.
 */
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
