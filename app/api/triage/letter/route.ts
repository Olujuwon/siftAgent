/**
 * PURPOSE
 * POST /api/triage/letter — resume a triage that paused before drafting.
 *
 * CONTRACT
 *   in   { "threadId": "<from the triage response>" }
 *   out  { letterDraft }
 *   err  { error }   404 when the run can't be found or isn't paused
 *
 * HOW IT RESUMES
 * The triage run stopped inside draft_letter at interrupt(). Invoking the graph
 * with Command({ resume }) and the same thread_id loads that saved state and
 * re-runs draft_letter from the top; this time interrupt() returns instead of
 * throwing, and the node drafts the letter.
 *
 * GOTCHAS
 * - Resuming an UNKNOWN thread_id doesn't throw. It returns {} and does
 *   nothing. So check the saved state first: the run must exist and be paused
 *   at draft_letter, or there is nothing to resume.
 * - The checkpointer is in memory. A server restart, or a request landing on a
 *   different serverless instance, loses the paused run. That's the 404 case;
 *   the fix for the user is to triage again.
 * - Resuming an already-finished run is also a 404, so a double-click can't
 *   draft twice.
 */

import { NextResponse } from "next/server";
import { Command } from "@langchain/langgraph";

import { graph } from "@/lib/agent/graph";
import type { LetterRequest, LetterResponse, TriageErrorResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let threadId: string;
  try {
    ({ threadId } = (await request.json()) as LetterRequest);
  } catch {
    return NextResponse.json<TriageErrorResponse>(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof threadId !== "string" || threadId === "") {
    return NextResponse.json<TriageErrorResponse>(
      { error: "Missing threadId." },
      { status: 400 },
    );
  }

  const config = { configurable: { thread_id: threadId } };

  try {
    // `next` lists the nodes that would run on resume. Paused at draft_letter
    // means it's in there; unknown or finished threads give [].
    const snapshot = await graph.getState(config);
    if (!snapshot.next.includes("draft_letter")) {
      return NextResponse.json<TriageErrorResponse>(
        { error: "This triage has expired. Run it again to draft a letter." },
        { status: 404 },
      );
    }

    const result = await graph.invoke(new Command({ resume: true }), config);

    if (!result.letterDraft) {
      console.error("[triage:letter] resumed but no letter was produced");
      return NextResponse.json<TriageErrorResponse>(
        { error: "Drafting failed. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json<LetterResponse>({ letterDraft: result.letterDraft });
  } catch (error) {
    console.error("[triage:letter]", error);
    return NextResponse.json<TriageErrorResponse>(
      { error: "Drafting failed. Please try again." },
      { status: 500 },
    );
  }
}
