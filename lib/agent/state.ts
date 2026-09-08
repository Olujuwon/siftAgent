/** Graph state schema + the zod schemas the nodes share. */

import { ReducedValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod/v4";

import type { FitScore } from "../types";

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

  researchGaps: z.array(z.string())
      .describe("What you still need to know to judge this properly. Empty if you have enough."),

  matched: z.array(z.string())
      .describe("Requirements clearly met by the resume. Quote the requirement."),

  missing: z.array(z.string())
      .describe("Requirements not met. Include anything the resume doesn't mention at all."),

  reasoning: z.string()
      .describe("Two or three sentences. Ground it in matched/missing, not vibes."),
});

export const jobInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("url"), value: z.url() }),
  z.object({ type: z.literal("text"), value: z.string().min(1) }),
]);

export type SearchResult = z.infer<typeof searchResultSchema>;
export type JobInput = z.infer<typeof jobInputSchema>;

// Errors if lib/types.ts's FitScore drifts from fitScoreSchema.
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _fitScoreInSync: Exact<FitScore, z.infer<typeof fitScoreSchema>> = true;
void _fitScoreInSync;

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
});

export type SiftStateType = typeof SiftState.State;
export type SiftStateUpdate = typeof SiftState.Update;

export const MAX_RESEARCH_ATTEMPTS = 3;
