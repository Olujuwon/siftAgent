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

/**
 * One research hit, as shown to the browser.
 *
 * MIRRORS `searchResultSchema` in lib/agent/state.ts — state.ts asserts the two
 * match, so drift is a compile error there. Hand-written here for the same
 * reason as FitScore: this module imports nothing.
 */
export type SearchResult = {
  title: string;
  url: string;
  content: string;
  /** Tavily's relevance for the query that found it, not fit. */
  relevance: number;
  publishedDate?: string;
  /** Which loop pass produced this. */
  attempt: number;
  /** The query that found it. */
  queryAngle: string;
};

/**
 * How long one node took, recorded per invocation.
 *
 * A node inside the loop appears once per pass, so score_fit shows up three
 * times on a full run. That per-pass breakdown is the point: a total tells you
 * a triage was slow, this tells you which node and how many times.
 */
export type NodeTiming = {
  node: string;
  durationMs: number;
};

/** Success response from `POST /api/triage`. */
export type TriageResponse = {
  fitScore: FitScore;
  /**
   * Absent when the score was below WORTH_APPLYING_SCORE: the graph paused
   * before drafting. letterPending says so, and threadId resumes it.
   */
  letterDraft?: string;
  /** True when the run is paused at draft_letter, waiting to be asked. */
  letterPending: boolean;
  /** Identifies this run's saved state, for POST /api/triage/letter. */
  threadId: string;
  /** How many research loops ran — the only outside view of whether the loop fired. */
  attempts: number;
  /**
   * The employer intake identified, or null if the posting doesn't name one.
   * Shown so a wrong identification is catchable — research on the wrong
   * company produces a plausible score built on the wrong evidence.
   */
  company: string | null;
  /** Everything the research node found, across all passes. */
  searchResults: SearchResult[];
  /** Per-node durations, in the order they ran. */
  timings: NodeTiming[];
  /** Wall-clock for the whole graph invocation, measured in the route. */
  durationMs: number;
};

/** Request body for `POST /api/triage/letter`: resume a paused run. */
export type LetterRequest = {
  threadId: string;
};

/** Success response from `POST /api/triage/letter`. */
export type LetterResponse = {
  letterDraft: string;
};

/** Keep the message generic; never forward provider errors verbatim. */
export type TriageErrorResponse = {
  error: string;
};

/**
 * Request body for `POST /api/resume`.
 *
 * Text only for now. The PDF path will arrive as multipart FormData instead of
 * JSON, so it won't use this type — see the route.
 */
export type ResumeUploadRequest = {
  resumeText: string;
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
