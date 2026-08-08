/**
 * Tavily wrapper — used by two nodes, for two different Tavily endpoints.
 *
 * STUB.
 *
 *   search()  -> research node. Company info: funding, tech stack, news.
 *   extract() -> intake node. Pulls the posting body out of a job URL.
 *
 * Both live here so `TAVILY_API_KEY` is read in exactly one place and neither
 * node imports the SDK directly.
 *
 * TODO: import { tavily } from "@tavily/core";
 *
 * Notes when you implement:
 * - Read the key from process.env.TAVILY_API_KEY and throw a clear error if
 *   it's missing. A missing key should fail at startup, not as a confusing
 *   401 three nodes deep.
 * - Server-only module. Never import this from a client component; the key
 *   would end up in the browser bundle.
 * - Consider a small client cache / single instantiation instead of creating
 *   a client per call.
 */

/**
 * Build-time guard. If any client component ever imports this module — directly
 * or through a chain of imports — the build FAILS instead of quietly shipping
 * TAVILY_API_KEY to the browser. Cheaper than remembering not to.
 */
import "server-only";

import type { SearchResult } from "../state";

/**
 * STUB: company research search.
 *
 * TODO: call Tavily search. Worth looking at: `searchDepth`, `maxResults`,
 * and `includeAnswer` (a synthesised answer may save score_fit some tokens).
 */
export async function search(query: string): Promise<SearchResult[]> {
  // TODO
  throw new Error("Tavily search not implemented");
}

/**
 * STUB: extract posting text from a URL.
 *
 * TODO: call Tavily extract and return the page content as plain text.
 * Handle the "extraction returned nothing useful" case explicitly — some
 * postings are behind a login and there is no text to get.
 */
export async function extract(url: string): Promise<string> {
  // TODO
  throw new Error("Tavily extract not implemented");
}
