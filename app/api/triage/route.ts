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

import { graph } from "@/lib/agent/graph";
import type { JobInput } from "@/lib/agent/state";
import { ExtractError } from "@/lib/agent/tools/search";
import { getSessionId } from "@/lib/resume/session";
import { readResumeSummary } from "@/lib/resume/store";
import type { TriageErrorResponse, TriageRequest, TriageResponse } from "@/lib/types";

export const runtime = "nodejs";

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
  // get, not ensure: a triage without a session has no CV to score against,
  // which the check below already reports. A new cookie here would be pointless.
  const sessionId = await getSessionId();

  let stored;
  try {
    stored = sessionId ? await readResumeSummary(sessionId) : null;
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

    // With a checkpointer, every run needs a thread_id: it's the key the saved
    // state is stored under. A fresh one per triage, returned so the letter
    // route can resume this exact run.
    const threadId = crypto.randomUUID();
    const config = { configurable: { thread_id: threadId } };
    const result = await graph.invoke(
      { jobInput: sniffJobInput(jobInput), resumeSummary: stored.summary },
      config,
    );
    const durationMs = Date.now() - startedAt;

    // A paused run doesn't throw; invoke() just returns the state so far. Ask
    // the checkpointer whether draft_letter is still waiting to run. The letter
    // route asks the same question, so both agree on what "paused" means.
    const { next } = await graph.getState(config);
    const letterPending = next.includes("draft_letter");

    console.log(
      `[triage] ${durationMs}ms · ${result.attempts} pass(es)` +
        (letterPending ? " · letter pending" : "") +
        " · " +
        result.timings.map((t) => `${t.node} ${t.durationMs}ms`).join(", "),
    );

    // Fields listed, not spread: the raw result also carries jobText, the
    // resume summary and LangGraph's own keys, none of which the browser needs.
    return NextResponse.json<TriageResponse>({
      fitScore: result.fitScore!,
      letterDraft: result.letterDraft,
      letterPending,
      threadId,
      attempts: result.attempts,
      company: result.company ?? null,
      searchResults: result.searchResults,
      timings: result.timings,
      durationMs,
    });
  } catch (error) {
    // A URL we couldn't read is the user's problem to fix, not ours — say so,
    // with a 400 and an actionable message. Everything else stays generic,
    // since provider errors can carry request details that shouldn't leak.
    if (error instanceof ExtractError) {
      return NextResponse.json<TriageErrorResponse>(
        { error: error.message },
        { status: 400 },
      );
    }
    console.error("[triage]", error);
    return NextResponse.json<TriageErrorResponse>(
      { error: "Triage failed. Please try again." },
      { status: 500 },
    );
  }
}
