/**
 * PURPOSE
 * NODE `draft_letter` — final node. Generates a cover letter OPENER, then END.
 *
 * STATUS
 * Real: one Claude call when ANTHROPIC_API_KEY is set, placeholder otherwise.
 *
 * EXPORTS
 * - draftLetter(state) -> Partial<state>   sets letterDraft
 *
 * GOTCHAS
 * - An opener, not a full letter. Two short paragraphs at most.
 * - Inflating a side project into production experience is the default failure
 *   mode of this node. The CAVEATS block in resumeSummary is the defence, and
 *   the prompt treats it as binding.
 * - No hardcoded stack here, same reasoning as scoreFit: resumeSummary already
 *   classifies per-CV, and a second list would contradict it.
 * - Plain string out. No structured output — letterDraft is a string in state.
 * - Runs once per triage, after the loop has finished, so it sees the
 *   accumulated research rather than one pass.
 *
 * ON DEMAND BELOW THE THRESHOLD
 * A score >= WORTH_APPLYING_SCORE drafts straight away. Below it, the node
 * calls interrupt(): the graph pauses here, its state is saved by the
 * checkpointer, and the triage route returns with letterPending. If the user
 * clicks "Draft cover letter", POST /api/triage/letter resumes the run with
 * Command({ resume: true }).
 *
 * - interrupt() MUST be the first thing in the node. On resume the node runs
 *   again FROM THE TOP, and interrupt() returns the resume value instead of
 *   throwing. Anything above it (a model call, say) would run twice.
 * - Demo mode pauses too, so the public demo shows the same flow.
 */

import { createModel } from "@/lib/ai/model";
import { hasAnthropicKey } from "@/lib/config";
import { WORTH_APPLYING_SCORE } from "@/lib/constants";
import { interrupt } from "@langchain/langgraph";
import type { SiftStateType } from "../state";

const SYSTEM_PROMPT = `You write the OPENING of a cover letter — the first two paragraphs, not a whole letter. Someone will finish it themselves.

Voice:
- Short and direct. Every sentence earns its place.
- No throat-clearing. Never "I am writing to express my interest in", "I was
  excited to see", or any variation. Open with something of substance.
- Plain, human register. Not corporate, not breathless.

NO DASHES AS CONNECTORS. This is the clearest signal that a machine wrote the
letter, and a reader who notices it discounts everything else.
- Banned in every form: em dash (—), en dash (–), double hyphen (--), and a
  spaced hyphen used the same way ( - ).
- Do not substitute one for another. The problem is the construction, not the
  character.
- When two clauses want joining, use a full stop, a comma, a colon, or rewrite
  the sentence so it does not need joining. A full stop is almost always
  better.
- Hyphens inside words are fine and expected: full-stack, side-project,
  end-to-end, six-year.

Two more habits to avoid, for the same reason:
- The "not just X, but Y" construction, and its variants.
- Three-item lists where two items would do. Reaching for a third to complete
  a rhythm is a tell.

Accuracy — this is the part that matters most:
- The CANDIDATE section classifies their experience. PRIMARY STACK is
  production work. SECONDARY is side projects, training, or tools listed
  without context.
- CAVEATS are binding. If a technology is marked training-only or
  side-project-only, you may mention it as exactly that, or not at all. You may
  never write it in a way that reads as professional experience.
- Claim nothing absent from the CANDIDATE section. Do not infer skills from
  adjacent ones.
- If the strongest honest opening is weaker than you would like, write the
  weaker one. A letter that overstates gets found out in the interview.

Substance:
- Lead with the most specific true overlap between this candidate and this
  posting.
- Use the RESEARCH if it gives you something concrete — what the company
  builds, their stack, something they shipped. If the research says nothing
  useful, say nothing about the company rather than inventing enthusiasm.
- Name the role. Do not name the candidate; they will sign it.

Output the letter text only. No preamble, no subject line, no sign-off, no
commentary about what you wrote.`;

export async function draftLetter(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  // First line on purpose — see ON DEMAND above. The first run throws here and
  // the graph pauses; the resumed run gets the resume value back and carries on.
  const score = state.fitScore?.score ?? 0;
  if (score < WORTH_APPLYING_SCORE) {
    interrupt({ reason: "below_threshold", score });
  }

  if (!hasAnthropicKey) return demoLetter(state);

  // Writing, not analysis. The judgement already happened in score_fit, and its
  // reasoning is passed in — this node turns that into prose.
  const model = createModel({ maxTokens: 1500, effort: "medium" });

  const response = await model.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        `JOB POSTING:\n${state.jobText ?? "(missing)"}`,
        `CANDIDATE:\n${state.resumeSummary}`,
        // score_fit already worked out what matches. Reusing its conclusion
        // keeps the letter consistent with the score the user is looking at.
        state.fitScore
          ? [
              `FIT ASSESSMENT (score ${state.fitScore.score}/10):`,
              state.fitScore.reasoning,
              state.fitScore.matched.length > 0
                ? `Strongest overlaps: ${state.fitScore.matched.join("; ")}`
                : "No clear overlaps were identified.",
            ].join("\n")
          : "FIT ASSESSMENT: none available.",
        `RESEARCH:\n${formatResearch(state)}`,
      ].join("\n\n---\n\n"),
    },
  ]);

  const letterDraft = response.text.trim();
  if (letterDraft === "") {
    throw new Error("The model returned an empty letter.");
  }
  return { letterDraft };
}

/** Company research, flattened. Says so explicitly when there is nothing. */
function formatResearch(state: SiftStateType): string {
  if (state.searchResults.length === 0) {
    return "Nothing was found about the company. Do not speculate about them.";
  }
  return state.searchResults
    .map((result) => `- ${result.title}\n  ${result.content}`)
    .join("\n");
}

/** Used when no ANTHROPIC_API_KEY is configured. See lib/config.ts. */
function demoLetter(state: SiftStateType): Partial<SiftStateType> {
  return {
    letterDraft: `[demo mode — no model was called]\n\nA cover letter opener would appear here, written from the posting, the CV summary and the research above. Fit score ${state.fitScore?.score ?? "n/a"}/10 after ${state.attempts} research pass(es).`,
  };
}
