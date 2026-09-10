/**
 * PURPOSE
 * NODE `research` — company research via Tavily. Re-entered by the conditional
 * edge, so it runs more than once per graph invocation.
 *
 * EXPORTS
 * - research(state) -> Partial<state>   appends searchResults, bumps attempts
 *
 * STEPS
 * 1. Work out the company name from jobText (intake may already have it).
 * 2. Pick a query angle based on state.attempts (see SKETCH).
 * 3. Call `search()` from ../tools/search.ts
 * 4. Return new results + the incremented counter.
 *
 * GOTCHAS
 * - APPEND to searchResults, never overwrite. The loop is pointless if each
 *   pass wipes the last one. The reducer in state.ts does this — just return
 *   the new items.
 * - On a retry, search a DIFFERENT angle. Same query = same results = the score
 *   never moves and you loop to the cap for nothing.
 * - Keep `attempts` consistent with whatever convention state.ts picked.
 *
 * SKETCH — query angles by attempt
 *   0 -> "<company> tech stack engineering"
 *   1 -> "<company> funding recent news"
 *   2 -> "<company> glassdoor culture interview process"
 */

import type {SiftStateType} from "../state";
import {search} from "@/lib/agent/tools/search";


export const RESEARCH_ANGLES = ["<company> tech stack engineering", "<company> funding recent news",
  "<company> glassdoor culture interview", "<company> what they build products customers"];

const companyName = "Songtradr";   // TODO: extract properly

export async function research(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  const searchQuery = RESEARCH_ANGLES[state.attempts].replace("<company>", companyName);
  const results = await search(searchQuery);
  return { searchResults: results.map(r =>
        ({...r, attempt: state.attempts})), attempts: state.attempts + 1 }
}
