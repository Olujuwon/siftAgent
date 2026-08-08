/**
 * Graph state schema.
 *
 * STUB — the shape below is a skeleton. You wire up the real
 * `Annotation.Root(...)` / channel reducers yourself.
 *
 * Reference for what each field is for (from the requirements doc):
 *
 *   jobInput       { type: "url" | "text"; value: string } — detect which was
 *                  given rather than making the user choose.
 *   jobText        Resolved posting text. Always populated once `intake` runs.
 *                  URL  -> fetch + extract (Tavily Extract) before continuing.
 *                  text -> pass through as-is.
 *   resumeSummary  Your skills/experience summary.
 *   searchResults  ACCUMULATES across research loops. This is the one channel
 *                  that needs a real reducer (append, not overwrite) — every
 *                  other field can use the default last-write-wins.
 *   attempts       Research loop counter. Hard cap at 2-3.
 *   fitScore       Structured output from score_fit (score + reasoning).
 *   letterDraft    Final output from draft_letter.
 */

// TODO: import { Annotation } from "@langchain/langgraph";
// TODO: import { z } from "zod";

/**
 * `JobInput` and `FitScore` are the shape the browser also sees, so they live in
 * `lib/types.ts` (which imports nothing). Re-exported here so the nodes can
 * keep importing everything state-related from one place.
 */
import type { FitScore, JobInput } from "../types";
export type { FitScore, JobInput };

/**
 * One result from the research node.
 *
 * Note this type stays HERE rather than in `lib/types.ts` — raw search results
 * are server-internal scratch data. They exist to feed score_fit mid-run and
 * are not part of the API response.
 *
 * TODO: decide the real shape. Tavily search results give you roughly
 * { title, url, content, score } — you may also want to tag each result with
 * the attempt number / query angle that produced it, so score_fit can tell
 * "thin research" from "researched twice and still nothing".
 */
export type SearchResult = {
  // TODO: replace this index signature with the real fields.
  [key: string]: unknown;
};

/**
 * TODO: define the zod schema for the structured fit score here, so the same
 * schema can be handed to the model via `withStructuredOutput()`:
 *
 *   export const fitScoreSchema = z.object({ ... });
 *
 * The schema belongs in this file, not in `lib/types.ts` — it's a runtime value
 * (importing it pulls in zod), and `lib/types.ts` is deliberately import-free.
 * Once it exists, make `FitScore` there `z.infer<typeof fitScoreSchema>`, or
 * keep the two in step by hand.
 */

/**
 * STUB: the LangGraph state definition.
 *
 * Replace this hand-written type with an `Annotation.Root({ ... })` call, then
 * derive the type from it:
 *
 *   export const SiftState = Annotation.Root({
 *     jobInput: Annotation<JobInput>(),
 *     searchResults: Annotation<SearchResult[]>({
 *       reducer: (prev, next) => prev.concat(next),
 *       default: () => [],
 *     }),
 *     attempts: Annotation<number>({ ... }),
 *     ...
 *   });
 *   export type SiftStateType = typeof SiftState.State;
 *
 * Keeping the plain type here for now so the rest of the scaffold type-checks.
 */
export type SiftStateType = {
  jobInput: JobInput;
  jobText?: string;
  resumeSummary: string;
  searchResults: SearchResult[];
  attempts: number;
  fitScore?: FitScore;
  letterDraft?: string;
};

/**
 * Hard cap on research loops, regardless of model confidence. The conditional
 * edge after score_fit must respect this or the graph can spin forever.
 */
export const MAX_RESEARCH_ATTEMPTS = 3;
