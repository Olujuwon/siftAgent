/**
 * Shared types — the contract between the browser and the server.
 *
 * This module is the LEAF of the dependency graph. It must never import
 * anything: no langgraph, no Tavily, no React. That is the whole point of it
 * existing separately from `lib/agent/state.ts`.
 *
 * Why it matters: `components/` runs in the browser and `app/api/triage/route.ts`
 * runs on the server, and both need to agree on the shape of the request and
 * response. If they imported that shape from `state.ts`, the client would pull
 * langgraph into its import graph. Type-only imports do get erased at build
 * time, so it would probably work — but one accidental value import (a zod
 * schema, a constant) turns "probably fine" into a bundled agent framework.
 * Keeping the wire contract in a dependency-free module removes the question.
 *
 * Rule of thumb: if the browser needs to know about it, it belongs here. If it
 * only ever exists server-side mid-run (like `SearchResult`), it belongs in
 * `lib/agent/state.ts`.
 */

/**
 * How the posting arrived. The SERVER decides which this is — the browser sends
 * one raw string and the route handler sniffs it. Don't make the user pick.
 */
export type JobInput = {
  type: "url" | "text";
  value: string;
};

/**
 * The fit verdict, as sent to the browser.
 *
 * STUB. Schema is deliberately TBD (see the requirements doc). Decide:
 *   - the scale (0-10? 0-100?)
 *   - whether `reasoning` is one blob or a breakdown of matched vs missing
 *   - whether the model's own confidence is exposed to the UI
 *
 * When you write the zod schema in `lib/agent/state.ts`, keep it in step with
 * this type — or better, define the schema there and make this
 * `z.infer<typeof fitScoreSchema>`. Just be aware that importing the schema
 * itself into a client component would bundle zod.
 */
export type FitScore = {
  // TODO: replace this index signature with the real fields.
  [key: string]: unknown;
};

/** Request body for `POST /api/triage`. One raw string, server sniffs the type. */
export type TriageRequest = {
  /** A job posting URL, or the full posting text. */
  jobInput: string;
};

/** Success response from `POST /api/triage`. */
export type TriageResponse = {
  fitScore: FitScore;
  letterDraft: string;
  /**
   * How many research loops ran. Not strictly needed by the UI, but it's the
   * only way to see from outside whether the conditional edge actually fired —
   * which is part of the Phase 1 definition of done.
   */
  attempts: number;
};

/** Error response. Keep the message generic; never forward provider errors verbatim. */
export type TriageErrorResponse = {
  error: string;
};
