/**
 * PURPOSE
 * POST /api/triage — the browser's only route to the agent. Invokes the graph.
 *
 * STATUS
 * Working end to end, but the graph is only START -> intake -> END, and
 * resumeSummary is a placeholder until lib/resume/* exists.
 *
 * CONTRACT
 *   in   { "jobInput": "<a URL or the raw posting text>" }
 *   out  the full graph state (narrow to TriageResponse once more nodes land)
 *   err  { error }
 *
 * TODO
 * - narrow the response to { fitScore, letterDraft, attempts } once score_fit
 *   and draft_letter are wired; keep raw searchResults out of it
 *
 * GOTCHAS
 * - The SERVER decides url vs text, never the user.
 * - Never let a provider error reach the client verbatim; it can carry key
 *   fragments and request details. Log the real one, return a generic message.
 * - Node runtime, not Edge — LangGraph and the Anthropic SDK both need it.
 * - `attempts` in the response is how you see from outside whether the
 *   conditional edge fired — part of the Phase 1 definition of done.
 */

import { NextResponse } from "next/server";

import { buildGraph } from "@/lib/agent/graph";
import type { JobInput } from "@/lib/agent/state";
import { readResumeSummary } from "@/lib/resume/store";
import type { TriageErrorResponse, TriageRequest } from "@/lib/types";

export const runtime = "nodejs";

// Compiled once per server process, not per request.
const graph = buildGraph();

/**
 * Decide whether the pasted string is a URL or raw posting text.
 *
 * Pure, so it's testable without a server. `new URL()` throws on anything
 * unparseable — that's the text case. The protocol check matters: `mailto:` and
 * `file:///etc/passwd` both parse fine and are not job postings.
 */
export function sniffJobInput(raw: string): JobInput {
  const value = raw.trim();
  try {
    const { protocol } = new URL(value);
    if (protocol === "http:" || protocol === "https:") {
      return { type: "url", value };
    }
  } catch {
    // Not parseable as a URL — fall through to text.
  }
  return { type: "text", value };
}

export async function POST(request: Request) {
  let jobInput: string;
  try {
    ({ jobInput } = (await request.json()) as TriageRequest);
  } catch {
    return NextResponse.json<TriageErrorResponse>(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof jobInput !== "string" || jobInput.trim() === "") {
    return NextResponse.json<TriageErrorResponse>(
      { error: "Provide a job posting URL or the posting text." },
      { status: 400 },
    );
  }

  // Read the stored resume BEFORE invoking. Scoring a posting against nothing
  // produces a confident, meaningless answer and still costs model calls.
  let stored;
  try {
    stored = await readResumeSummary();
  } catch (error) {
    console.error("[triage:resume]", error);
    return NextResponse.json<TriageErrorResponse>(
      { error: "Could not read your stored resume." },
      { status: 500 },
    );
  }

  if (!stored) {
    return NextResponse.json<TriageErrorResponse>(
      { error: "Add your CV first — POST it to /api/resume." },
      { status: 400 },
    );
  }

  try {
    // Wall clock for the whole invocation. The per-node figures come from the
    // `timings` channel; this is the number that includes graph overhead.
    const startedAt = Date.now();
    const result = await graph.invoke({
      jobInput: sniffJobInput(jobInput),
      resumeSummary: stored.summary,
    });
    const durationMs = Date.now() - startedAt;

    console.log(
      `[triage] ${durationMs}ms · ${result.attempts} pass(es) · ` +
        result.timings.map((t) => `${t.node} ${t.durationMs}ms`).join(", "),
    );

    return NextResponse.json({ ...result, durationMs });
  } catch (error) {
    console.error("[triage]", error);
    return NextResponse.json<TriageErrorResponse>(
      { error: "Triage failed. Please try again." },
      { status: 500 },
    );
  }
}
