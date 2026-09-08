/**
 * PURPOSE
 * The contract between the browser and the server. Request/response shapes only.
 *
 * STATUS
 * FitScore is still a placeholder; everything else is real.
 *
 * HARD RULE: THIS MODULE IMPORTS NOTHING
 * No langgraph, no zod, no React. That's why it's separate from
 * lib/agent/state.ts.
 *
 * Why: components/ runs in the browser and the route handlers run on the server,
 * and both need these shapes. If they came from state.ts the client would pull
 * langgraph into its import graph. Type-only imports are erased at build time so
 * it would probably work — but one accidental value import (a zod schema, a
 * constant) turns "probably fine" into a bundled agent framework. A
 * dependency-free module removes the question.
 *
 * WHERE THINGS GO
 * - browser needs to know about it            -> here
 * - server-side scratch data (SearchResult)   -> lib/agent/state.ts
 * - runtime values (zod schemas)              -> lib/agent/state.ts
 * - component props                           -> next to the component
 */

/**
 * The fit verdict, as sent to the browser.
 *
 * MIRRORS `fitScoreSchema` in lib/agent/state.ts — keep the two in step. It is
 * hand-written rather than `z.infer<typeof fitScoreSchema>` because inferring it
 * would mean importing state.ts, and this module imports nothing. State.ts
 * asserts the two match (`_fitScoreInSync`), so drift is a compile error there.
 */
export type FitScore = {
  score: number;
  confidence: "low" | "medium" | "high";
  researchGaps: string[];
  matched: string[];
  missing: string[];
  reasoning: string;
};

/**
 * Request body for `POST /api/triage`.
 *
 * No `resumeSummary` field — the resume is uploaded separately via
 * `POST /api/resume` and cached server-side, so the triage route reads it from
 * the store rather than accepting it per request.
 */
export type TriageRequest = {
  /** A job posting URL, or the full posting text. */
  jobInput: string;
};

/** Success response from `POST /api/triage`. */
export type TriageResponse = {
  fitScore: FitScore;
  letterDraft: string;
  /** How many research loops ran — the only outside view of whether the loop fired. */
  attempts: number;
};

/** Keep the message generic; never forward provider errors verbatim. */
export type TriageErrorResponse = {
  error: string;
};

/**
 * Success response from `POST /api/resume`.
 *
 * The summary is returned so the UI can display it — the only point at which a
 * hallucinated summary is catchable before it skews every later triage.
 */
export type ResumeUploadResponse = {
  summary: string;
  updatedAt: string;
  sourceFilename: string;
};

/**
 * Response from `GET /api/resume`.
 *
 * A discriminated union, so the UI can't read `summary` without checking one
 * exists. "No resume yet" is a normal first-run state — a 200 with
 * `hasResume: false`, not a 404.
 */
export type ResumeStatusResponse =
  | { hasResume: false }
  | ({ hasResume: true } & ResumeUploadResponse);

/** Same rule as TriageErrorResponse: generic messages only. */
export type ResumeErrorResponse = {
  error: string;
};
