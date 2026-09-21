/** Graph state schema + the zod schemas the nodes share. */

import { ReducedValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod/v4";

import type { FitScore, SearchResult as WireSearchResult } from "../types";

export const searchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  content: z.string(),
  relevance: z.number(), // Tavily's, not fit
  publishedDate: z.string().optional(),
  attempt: z.number().int(), // ours — research must add these two
  queryAngle: z.string(),
});

// .describe() is the prompt for withStructuredOutput, not documentation.
export const fitScoreSchema = z.object({
  score: z.number().int().min(0).max(10)
      .describe("Overall fit, 0-10. 7+ means worth applying to."),

  confidence: z.enum(["low", "medium", "high"])
      .describe("How sure you are, given the research available. Use 'low' if the research didn't tell you enough about the company's stack."),

  // No .max() on these, deliberately. Structured output does not enforce length
  // while generating — a reasoning field came back at 683 chars against a
  // .max(600) — so a hard bound can't prevent long output, only reject it after
  // the fact, discarding the whole call. Limits live in the descriptions, which
  // steer the model, and scoreFit trims after parsing, which protects callers.
  researchGaps: z.array(z.string())
      .describe("What you still need to know, as short web search queries. At most 3. Empty if you have enough."),

  matched: z.array(z.string())
      .describe("Requirements met. Quote the requirement only, no commentary. One short line each. At most 6."),

  missing: z.array(z.string())
      .describe("Requirements not met. Quote the requirement only, no commentary. One short line each. At most 6."),

  reasoning: z.string()
      .describe("Two or three sentences grounded in matched/missing. Prose, not a list."),
});

export const nodeTimingSchema = z.object({
  node: z.string(),
  durationMs: z.number(),
});

export const jobInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("url"), value: z.url() }),
  z.object({ type: z.literal("text"), value: z.string().min(1) }),
]);

export type SearchResult = z.infer<typeof searchResultSchema>;
export type JobInput = z.infer<typeof jobInputSchema>;

// Errors if lib/types.ts drifts from the schemas here. The browser renders
// both shapes, so they have to stay in step.
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _fitScoreInSync: Exact<FitScore, z.infer<typeof fitScoreSchema>> = true;
const _searchResultInSync: Exact<WireSearchResult, SearchResult> = true;
void _fitScoreInSync;
void _searchResultInSync;

export const SiftState = new StateSchema({
  jobInput: jobInputSchema,
  jobText: z.string().optional(),
  resumeSummary: z.string(),
  attempts: z.number().default(() => 0), // nodes return state.attempts + 1, never 1
  searchResults: new ReducedValue(
    z.array(searchResultSchema).default(() => []),
    {
      inputSchema: z.array(searchResultSchema), // what a node returns
      reducer: (current, incoming) => [...current, ...incoming], // appends
    },
  ),
  fitScore: fitScoreSchema.optional(),
  letterDraft: z.string().optional(),

  // Appends like searchResults: every node invocation adds one entry, so a
  // node inside the loop appears once per pass.
  timings: new ReducedValue(z.array(nodeTimingSchema).default(() => []), {
    inputSchema: z.array(nodeTimingSchema),
    reducer: (current, incoming) => [...current, ...incoming],
  }),
});

export type SiftStateType = typeof SiftState.State;
export type SiftStateUpdate = typeof SiftState.Update;

export const MAX_RESEARCH_ATTEMPTS = 3;
