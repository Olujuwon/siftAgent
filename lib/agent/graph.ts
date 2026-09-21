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
import { StateGraph, START, END } from "@langchain/langgraph";
import { SiftState } from "./state";
import {research} from "@/lib/agent/nodes/research";
import {intake} from "@/lib/agent/nodes/intake";
import {routeAfterScore, scoreFit} from "@/lib/agent/nodes/scoreFit";
import {draftLetter} from "@/lib/agent/nodes/draftLetter";
import type { SiftStateType, SiftStateUpdate } from "./state";

/**
 * NOT Partial<SiftStateType>. The Update type permits the wrapper values a
 * reduced channel accepts (an explicit Overwrite, say), which Partial<State>
 * does not — so Update is the wider, correct type for what a node returns.
 * The nodes themselves declare Partial<State>, which is assignable to this.
 */
type Node = (state: SiftStateType) => Promise<SiftStateUpdate>;

/**
 * Wraps a node so it records how long it took.
 *
 * The duration goes into the `timings` channel, which APPENDS — so a node
 * inside the loop contributes one entry per pass. That per-pass breakdown is
 * the point: a single total tells you a triage was slow, this tells you which
 * node, and how many times it ran.
 *
 * Timing is logged even when the node throws, then the error is rethrown — a
 * node that failed after 30 seconds is exactly the one you want to see.
 */
function withTiming(name: string, node: Node): Node {
  return async (state) => {
    const startedAt = Date.now();
    try {
      const update = await node(state);
      return {
        ...update,
        timings: [{ node: name, durationMs: Date.now() - startedAt }],
      };
    } catch (error) {
      console.error(`[graph:${name}] failed after ${Date.now() - startedAt}ms`, error);
      throw error;
    }
  };
}

export function buildGraph() {
  return new StateGraph(SiftState)
      .addNode("intake", withTiming("intake", intake))
      .addNode("research", withTiming("research", research))
      .addNode("score_fit", withTiming("score_fit", scoreFit))
      .addNode("draft_letter", withTiming("draft_letter", draftLetter))
      .addEdge(START, "intake")
      .addEdge("intake", "research")
      .addEdge("research", "score_fit")
      // Keys must be exactly what routeAfterScore returns; values are the node
      // names from .addNode(). Both are plain strings — a mismatch fails at
      // runtime, not compile time.
      .addConditionalEdges("score_fit", routeAfterScore, {
        research: "research",
        draft_letter: "draft_letter",
      })
      .addEdge("draft_letter", END)
      .compile();
}
