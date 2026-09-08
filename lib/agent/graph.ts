/**
 * PURPOSE
 * Wire the nodes into a graph and compile it. This is the file the project
 * exists to make you write.
 *
 * STATUS
 * STUB. Nothing here but the map.
 *
 * EXPORTS
 * - buildGraph()  -> compiled graph, invoked by app/api/triage/route.ts
 *
 * SHAPE
 *   [intake] -> [research] -> [score_fit] -> ? -> [draft_letter] -> END
 *                   ^                       |
 *                   +---- loop if thin -----+
 *
 * STEPS
 * 1. new StateGraph(SiftState)          using the StateSchema from ./state
 * 2. .addNode() x4                      intake, research, score_fit, draft_letter
 * 3. .addEdge(START, "intake")          then straight edges through score_fit
 * 4. .addConditionalEdges(...)          the loop-back edge (see SKETCH)
 * 5. .addEdge("draft_letter", END)
 * 6. .compile()                         add MemorySaver later if you want resume
 *
 * BUILD ORDER — do not do all of it at once
 * a. START -> intake -> END. One node. Confirm it compiles and runs.
 * b. Hook up the route so the form gets a real response.
 * c. Add research, then score_fit, still a STRAIGHT LINE.
 * d. Only then swap the straight edge for addConditionalEdges.
 *
 * GOTCHAS
 * - Loop last. A conditional edge on an unverified pipeline gives you two
 *   candidate causes per failure, and one of them cycles and burns credits.
 * - Graph API, not the Functional API (`entrypoint`/`task`, also exported).
 *   Functional would make the loop a `while` and the edge an `if` — less code,
 *   but it hides the concepts this project teaches, and can't be visualised.
 * - Don't annotate the return type. Let .compile() infer it.
 *
 * SKETCH
 *   .addConditionalEdges("score_fit", routeAfterScore, {
 *     research: "research",
 *     draft_letter: "draft_letter",
 *   })
 */

import "server-only";

// TODO: import { StateGraph, START, END } from "@langchain/langgraph";
// TODO: import { SiftState } from "./state";
// TODO: import { intake } from "./nodes/intake";
// TODO: import { research } from "./nodes/research";
// TODO: import { scoreFit, routeAfterScore } from "./nodes/scoreFit";
// TODO: import { draftLetter } from "./nodes/draftLetter";

export function buildGraph() {
  throw new Error("graph not wired yet");
}
