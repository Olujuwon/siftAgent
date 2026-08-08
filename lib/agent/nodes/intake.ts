import type { SiftStateType } from "../state";

/**
 * NODE: intake — first node in the graph.
 *
 * STUB. Two jobs:
 *
 * 1. Resolve `jobInput` into `jobText`.
 *    - `type === "text"` -> pass the value straight through.
 *    - `type === "url"`  -> fetch and extract the posting body. Use Tavily's
 *      Extract API (already in the stack for search) rather than adding a
 *      scraping library; plain `fetch` gets blocked or returns a JS shell on
 *      most job boards.
 *    - Throw (or set an error channel) on an empty/unusable extraction so the
 *      graph fails loudly instead of scoring an empty posting.
 *
 * 2. Pull the key requirements out of the posting.
 *    - This probably does NOT need a model call. The posting text plus some
 *      plain string processing may be enough, and it keeps the graph cheap.
 *      If pure text processing turns out too brittle, escalate to a small
 *      model call here.
 *
 * Returns a partial state — LangGraph merges it into the channels.
 */
export async function intake(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  // TODO: branch on state.jobInput.type
  // TODO: if url -> extract via lib/agent/tools/search.ts
  // TODO: if text -> pass through
  // TODO: extract key requirements from the resolved text
  throw new Error("intake node not implemented");
}
