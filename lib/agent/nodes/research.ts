import type { SiftStateType } from "../state";

/**
 * NODE: research — company research via Tavily.
 *
 * STUB. What it should do:
 *
 * - Work out the company name from `jobText` (intake may already have it).
 * - Search for the things that actually inform a fit judgement: funding stage,
 *   tech stack, recent news, engineering blog, team size.
 * - APPEND to `searchResults`, never overwrite — this node runs more than once
 *   and the loop is pointless if each pass wipes the last one.
 * - Increment `attempts`.
 *
 * This node is re-entered by the conditional edge after score_fit. On a retry
 * it must search a DIFFERENT angle than last time, otherwise the loop just
 * re-fetches the same results and the score never moves. Use `attempts` (and/or
 * the queries recorded in `searchResults`) to pick the next angle, e.g.:
 *
 *   attempt 0 -> "<company> tech stack engineering"
 *   attempt 1 -> "<company> funding recent news"
 *   attempt 2 -> "<company> glassdoor culture interview process"
 */
export async function research(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  // TODO: derive company name
  // TODO: pick a query angle based on state.attempts
  // TODO: call the Tavily wrapper in lib/agent/tools/search.ts
  // TODO: return { searchResults: [...new results], attempts: state.attempts + 1 }
  throw new Error("research node not implemented");
}
