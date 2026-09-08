/**
 * PURPOSE
 * POST /api/triage — the browser's only route to the agent. Invokes the graph.
 *
 * STATUS
 * STUB. Returns 501.
 *
 * CONTRACT
 *   in   { "jobInput": "<a URL or the raw posting text>" }
 *   out  { fitScore, letterDraft, attempts }
 *   err  { error }
 *
 * No resume in the body — it's uploaded once via POST /api/resume and cached.
 *
 * STEPS
 * 1. Validate the body with zod. Reject an empty posting.
 * 2. Detect url vs text. Trim, then treat as URL only if it parses AND has an
 *    http(s) protocol. Everything else is raw text.
 * 3. readResumeSummary(). If null -> 400 pointing at the upload. Do NOT invoke
 *    the graph.
 * 4. buildGraph().invoke(initialState)
 * 5. Return fitScore + letterDraft + attempts.
 *
 * GOTCHAS
 * - The SERVER decides url vs text, never the user. Put the detection in its own
 *   tiny function so it's unit-testable.
 * - No resume = don't run the graph. Scoring against an empty resume produces a
 *   confident, meaningless answer and still costs a model call.
 * - Keep raw searchResults out of the response unless the UI needs them.
 * - Never let a provider error reach the client verbatim; it can carry key
 *   fragments and request details. Log the real one, return a generic message.
 * - Node runtime, not Edge — LangGraph and the Anthropic SDK both need it.
 * - Returning `attempts` is how you see from outside whether the conditional
 *   edge fired, which is part of the Phase 1 definition of done.
 */

import { NextResponse } from "next/server";

import type { TriageErrorResponse } from "@/lib/types";

// TODO: import type { TriageRequest, TriageResponse } from "@/lib/types";
// TODO: import { buildGraph } from "@/lib/agent/graph";
// TODO: import { readResumeSummary } from "@/lib/resume/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return NextResponse.json<TriageErrorResponse>(
    { error: "Not implemented" },
    { status: 501 },
  );
}
