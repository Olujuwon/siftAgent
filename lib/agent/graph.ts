/**
 * Graph wiring.
 *
 * STUB — this is the file the project exists to make you write. Nothing here
 * but the map.
 *
 *   [intake] -> [research] -> [score_fit] -> ? -> [draft_letter] -> END
 *                   ^                        |
 *                   +---- loop if thin ------+
 *
 * Steps:
 *
 * 1. `new StateGraph(SiftState)` using the annotation from ./state.
 * 2. `.addNode()` for each of: intake, research, score_fit, draft_letter.
 * 3. `.addEdge(START, "intake")`, then the straight edges through to score_fit.
 * 4. `.addConditionalEdges("score_fit", routeAfterScore, {
 *      research: "research",
 *      draft_letter: "draft_letter",
 *    })` — the loop-back edge is what makes this a graph rather than a chain.
 * 5. `.addEdge("draft_letter", END)`.
 * 6. `.compile()`. Add a checkpointer here later if you want resumable runs
 *    (MemorySaver is enough for local dev; the doc rules out a real DB for now).
 *
 * Export the compiled graph so app/api/triage/route.ts can invoke it.
 */

/**
 * Same build-time guard as `tools/search.ts`. The graph reaches the model and
 * the search tool, so it must never end up in a client bundle. The only way in
 * from the browser is `fetch("/api/triage")`.
 */
import "server-only";

// TODO: import { StateGraph, START, END } from "@langchain/langgraph";
// TODO: import { SiftState } from "./state";
// TODO: import { intake } from "./nodes/intake";
// TODO: import { research } from "./nodes/research";
// TODO: import { scoreFit, routeAfterScore } from "./nodes/scoreFit";
// TODO: import { draftLetter } from "./nodes/draftLetter";

/**
 * STUB: build and compile the graph.
 *
 * Return type is left loose on purpose — once you have a real
 * `Annotation.Root`, the compiled graph's type comes out of `.compile()` and
 * you should let TypeScript infer it instead of annotating by hand.
 */
export function buildGraph() {
  // TODO: wire the graph per the steps above and return the compiled result
  throw new Error("graph not wired yet");
}
