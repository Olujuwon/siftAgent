/**
 * PURPOSE
 * Tavily wrapper. Two endpoints, two callers — kept together so TAVILY_API_KEY
 * is read in exactly one place and no node imports the SDK directly.
 *
 * STATUS
 * Real when TAVILY_API_KEY is set, fakes otherwise.
 *
 * EXPORTS
 * - search(query) -> SearchResult[]   used by the research node
 * - extract(url)  -> string           used by the intake node
 * - ExtractError                      user-facing failure, safe to show
 *
 * GOTCHAS
 * - The SDK has a keyless mode, so a missing key doesn't fail — it degrades.
 *   createClient() checks explicitly.
 * - extract() failures don't throw from the SDK; they land in failedResults.
 * - Timeouts are in SECONDS.
 * - Server-only (enforced below). Importing this into a client component would
 *   put the key in the browser bundle.
 */

import "server-only";

import { tavily } from "@tavily/core";

import { hasTavilyKey } from "@/lib/config";
import type { SearchResult } from "../state";
import sampleJobPost from "../sampleJobPost.json";

/**
 * Thrown when a posting URL can't be read. Its message is written for the user
 * and is safe to show — the triage route forwards it. Anything else that goes
 * wrong here is an internal failure and gets a generic message.
 */
export class ExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}

/**
 * Built per call, same reasoning as createModel: a module-level client would
 * read the key at import time, and would construct on the demo deployment.
 *
 * The explicit check matters more here than for Anthropic. The Tavily SDK has a
 * KEYLESS mode — without a key it doesn't fail, it quietly falls into a
 * rate-limited free tier and errors later, somewhere unrelated.
 */
function createClient() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");
  return tavily({ apiKey });
}

/** Tavily's timeout is in SECONDS, not ms — the SDK multiplies by 1000. */
const SEARCH_TIMEOUT_S = 20;
const EXTRACT_TIMEOUT_S = 30;

/**
 * Company research. One query in, several hits out.
 *
 * `attempt` is omitted: the tool doesn't know which loop pass it is on. The
 * research node stamps that when mapping into state.
 */
export async function search(
  query: string,
): Promise<Omit<SearchResult, "attempt">[]> {
  if (!hasTavilyKey) return demoSearch(query);

  const response = await createClient().search(query, {
    maxResults: 5,
    searchDepth: "basic", // 1 credit; "advanced" costs 2
    // Full page text would go into state, into every checkpoint, and into the
    // score_fit prompt on every loop pass. The snippet in `content` is enough.
    includeRawContent: false,
    timeout: SEARCH_TIMEOUT_S,
  });

  return response.results.map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    relevance: result.score, // Tavily calls it score; ours is fit
    // Typed as a required string, but undated pages come back empty.
    publishedDate: result.publishedDate || undefined,
    queryAngle: query,
  }));
}

/**
 * Reads a job posting from a URL.
 *
 * Failure does NOT throw from the SDK. A login-walled or blocked page comes back
 * as a successful response with the URL listed in `failedResults` and nothing
 * in `results`. So both have to be checked — otherwise `results[0]` is quietly
 * undefined and an empty posting gets scored.
 */
export async function extract(url: string): Promise<string> {
  if (!hasTavilyKey) return sampleJobPost.job1;

  const response = await createClient().extract([url], {
    format: "text", // it's going into a prompt, not onto a page
    extractDepth: "basic",
    timeout: EXTRACT_TIMEOUT_S,
  });

  const failure = response.failedResults[0];
  if (failure) {
    console.error("[extract] failed", failure.url, failure.error);
    throw new ExtractError(
      "Couldn't read that page. It may need a login or block automated access, so paste the posting text instead.",
    );
  }

  const text = response.results[0]?.rawContent?.trim();
  if (!text) {
    throw new ExtractError(
      "That page had no readable text. Paste the posting text instead.",
    );
  }

  return text;
}

/**
 * Used when no TAVILY_API_KEY is configured. Three results derived from the
 * query, so loop passes stay distinguishable — if searchResults ever fills with
 * identical entries, the reducer is overwriting instead of appending.
 */
function demoSearch(query: string): Omit<SearchResult, "attempt">[] {
  return [1, 2, 3].map((n) => ({
    title: `Result ${n} for: ${query}`,
    url: `https://example.com/${encodeURIComponent(query)}/${n}`,
    content: `Fake content ${n}. Pretend this says something useful about "${query}".`,
    relevance: 1 - n * 0.1,
    queryAngle: query,
  }));
}
