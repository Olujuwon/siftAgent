/**
 * PURPOSE
 * NODE `intake` — first in the graph. Resolve jobInput into jobText, then pull
 * out the key requirements.
 *
 * STATUS
 * STUB.
 *
 * EXPORTS
 * - intake(state) -> Partial<state>   sets jobText
 *
 * STEPS
 * 1. Branch on state.jobInput.type
 *      "text" -> pass value through as-is
 *      "url"  -> fetch + extract via ../tools/search.ts `extract()`
 * 2. Extract key requirements from the resolved text.
 *
 * GOTCHAS
 * - Use Tavily Extract for URLs, not plain fetch. Most job boards block fetch
 *   or return a JS shell with no content.
 * - Throw on empty/unusable extraction. Otherwise you score an empty posting
 *   and get a confident, meaningless answer.
 * - Step 2 probably needs NO model call — string processing may be enough, and
 *   it keeps the graph cheap. Escalate to a model only if that proves brittle.
 * - This is the only node with no model call. Build it before the others.
 */

import type { SiftStateType } from "../state";
import {extract} from "@/lib/agent/tools/search";

export async function intake(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  if (state.jobInput.type === "text") {
    return {jobText: state.jobInput.value}
  }
  else {
    const extractResult = await extract(state.jobInput.value);
    return {jobText: extractResult}
  }
}
