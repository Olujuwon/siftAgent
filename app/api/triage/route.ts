import { NextResponse } from "next/server";

// Types shared with the browser — same contract both sides compile against.
// TODO: import type { TriageRequest, TriageResponse } from "@/lib/types";
import type { TriageErrorResponse } from "@/lib/types";

// LangGraph + the Anthropic SDK need the Node runtime, not Edge.
export const runtime = "nodejs";

/**
 * POST /api/triage
 *
 * STUB. Expected request body:
 *
 *   { "jobInput": "<a URL or the raw posting text>",
 *     "resumeSummary": "<optional override>" }
 *
 * Expected response:
 *
 *   { "fitScore": { ... }, "letterDraft": "...", "attempts": 2 }
 *
 * What to implement:
 *
 * 1. Parse and validate the body with zod. Reject an empty posting.
 * 2. Detect url vs text — the client sends one string, the server decides.
 *    Do NOT make the user pick. Something like: trim, then treat it as a URL
 *    only if it parses as one AND has an http(s) protocol; everything else is
 *    raw text. Worth putting in its own tiny function so it's unit-testable.
 * 3. Load `resumeSummary` (a constant in the repo is fine for now).
 * 4. `buildGraph().invoke(initialState)`.
 * 5. Return fitScore + letterDraft. Keep raw searchResults out of the response
 *    unless you want them in the UI.
 *
 * Error handling: catch and return a 4xx/5xx with a plain message. Never let a
 * provider error bubble out verbatim, it can carry key fragments and request
 * details.
 */
export async function POST(request: Request) {
  // TODO: validate body with zod
  // TODO: detect url vs text
  // TODO: const graph = buildGraph(); const result = await graph.invoke({ ... })
  // TODO: return NextResponse.json({ fitScore, letterDraft })

  return NextResponse.json<TriageErrorResponse>(
    { error: "Not implemented" },
    { status: 501 },
  );
}
