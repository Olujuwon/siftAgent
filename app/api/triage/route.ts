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
 * - swap PLACEHOLDER_RESUME_SUMMARY for readResumeSummary(); 400 if it's null,
 *   and do NOT invoke the graph — scoring against an empty resume produces a
 *   confident, meaningless answer and still costs a model call
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
import type { TriageErrorResponse, TriageRequest } from "@/lib/types";

export const runtime = "nodejs";

// TODO: replace with readResumeSummary() from lib/resume/store.
const PLACEHOLDER_RESUME_SUMMARY = "Very perfect resume";

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

  try {
    const result = await graph.invoke({
      jobInput: sniffJobInput(jobInput),
      resumeSummary: PLACEHOLDER_RESUME_SUMMARY,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[triage]", error);
    return NextResponse.json<TriageErrorResponse>(
      { error: "Triage failed. Please try again." },
      { status: 500 },
    );
  }
}
