/**
 * PURPOSE
 * Tavily wrapper. Two endpoints, two callers — kept together so TAVILY_API_KEY
 * is read in exactly one place and no node imports the SDK directly.
 *
 * STATUS
 * STUB.
 *
 * EXPORTS
 * - search(query) -> SearchResult[]   used by the research node
 * - extract(url)  -> string           used by the intake node
 *
 * STEPS
 * 1. Read process.env.TAVILY_API_KEY, throw a clear error if missing.
 * 2. Instantiate the client once at module level, not per call.
 * 3. search():  worth looking at searchDepth, maxResults, includeAnswer —
 *    a synthesised answer may save score_fit some tokens.
 * 4. extract(): return page content as plain text.
 *
 * GOTCHAS
 * - Missing key should fail loudly at startup, not as a confusing 401 three
 *   nodes deep.
 * - extract() can legitimately return nothing — postings behind a login have no
 *   text to get. Handle that case explicitly rather than returning "".
 * - Server-only (enforced by the import below). Importing this from a client
 *   component would put the key in the browser bundle.
 * - Build this BEFORE finalising searchResultSchema in state.ts. Call it once
 *   and look at the real shape rather than guessing.
 *
 * SKETCH
 *   import { tavily } from "@tavily/core";
 *   const client = tavily({ apiKey: requireEnv("TAVILY_API_KEY") });
 */

import "server-only";

import type { SearchResult } from "../state";
import sampleJobPost from "../sampleJobPost.json";

// TODO: import { tavily } from "@tavily/core";


export async function search(query: string): Promise<SearchResult[]> {
  throw new Error("Tavily search not implemented");
}

export async function extract(url: string): Promise<string> {
  if (!url.startsWith("http")) {
    throw new Error("Tavily extract not implemented");
  }else{
    return sampleJobPost.job1;
  }
}
