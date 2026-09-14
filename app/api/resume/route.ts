/**
 * PURPOSE
 * The one-off resume setup endpoint. Runs when your resume changes, not per
 * triage.
 *
 * STATUS
 * Text path works. summarizeResume is still a fake; the PDF path is TODO.
 *
 * ROUTES
 * - POST   /api/resume   store a summary of pasted CV text
 * - GET    /api/resume   report whether a summary exists
 * - DELETE /api/resume   remove the stored summary
 *
 * PIPELINE
 *   text -> summarizeResume() -> writeResumeSummary()
 *   TODO PDF: FormData -> parsePdf() -> summarizeResume() -> write
 *
 * TODO — the PDF path
 * 1. Branch on Content-Type; multipart means await request.formData().
 * 2. Check file.size BEFORE reading bytes. ~5MB cap.
 * 3. parsePdf(new Uint8Array(await file.arrayBuffer())).
 * 4. 400 with a message naming the cause — "scanned PDF with no text layer" is
 *    actionable, "invalid file" is not.
 * 5. Blocked on a Node upgrade: every parser needs >=20.16 or >=22.
 *
 * GOTCHAS
 * - Never write the PDF to disk. PII, and nothing downstream needs it.
 * - Return the summary so the UI can display it. This is the ONLY point a
 *   hallucinated summary is catchable; unseen, it skews every later triage.
 * - GET returns 200 with hasResume:false, never 404. First run is not an error.
 * - DELETE is idempotent — clearing nothing succeeds.
 * - Never forward provider errors verbatim — they carry request IDs, URLs, and
 *   sometimes key fragments. Log the real one, return a generic one.
 * - No auth in Phase 1: this endpoint costs a model call and writes to disk.
 *   Fine on localhost, a reason not to deploy publicly as-is.
 */

import { NextResponse } from "next/server";

import { summarizeResume } from "@/lib/resume/summarize";
import {
  clearResumeSummary,
  readResumeSummary,
  writeResumeSummary,
} from "@/lib/resume/store";
import type {
  ResumeErrorResponse,
  ResumeStatusResponse,
  ResumeUploadRequest,
  ResumeUploadResponse,
} from "@/lib/types";

export const runtime = "nodejs";

/**
 * Upper bound only. There's no useful lower bound — an empty paste is caught by
 * the emptiness check, and any minimum above that would reject a legitimately
 * terse summary while letting through the same length of garbage.
 *
 * The cap is the real guard: compressing the CV is summarizeResume's job, but
 * it can only do that with what fits in a request, and a runaway paste costs
 * tokens before anyone notices.
 */
const MAX_RESUME_CHARS = 100_000;

/**
 * POST — accepts pasted CV text as JSON, summarises it, stores the summary.
 *
 * TODO: add the PDF path. That arrives as multipart FormData, not JSON, so it
 * branches on Content-Type: `await request.formData()`, pull the file field,
 * `await file.arrayBuffer()` -> parsePdf(). Blocked on a Node upgrade.
 */
export async function POST(request: Request) {
  let resumeText: string;
  try {
    ({ resumeText } = (await request.json()) as ResumeUploadRequest);
  } catch {
    return NextResponse.json<ResumeErrorResponse>(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof resumeText !== "string" || resumeText.trim() === "") {
    return NextResponse.json<ResumeErrorResponse>(
      { error: "Paste your CV text." },
      { status: 400 },
    );
  }

  if (resumeText.length > MAX_RESUME_CHARS) {
    return NextResponse.json<ResumeErrorResponse>(
      { error: "That's larger than we can process. Paste the relevant sections." },
      { status: 413 },
    );
  }

  try {
    const stored = {
      summary: await summarizeResume(resumeText),
      updatedAt: new Date().toISOString(),
      sourceFilename: "pasted text",
    };
    await writeResumeSummary(stored);

    // Returned so the UI can show it. This is the only point at which a bad
    // summary is catchable — unseen, it skews every later triage.
    return NextResponse.json<ResumeUploadResponse>(stored);
  } catch (error) {
    console.error("[resume:POST]", error);
    return NextResponse.json<ResumeErrorResponse>(
      { error: "Could not save your resume. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * GET — reports whether a summary exists.
 *
 * "No resume yet" is a normal first-run state, so it's a 200 with
 * hasResume: false, not a 404. The UI needs to tell that apart from a failure.
 */
export async function GET() {
  try {
    const stored = await readResumeSummary();
    return NextResponse.json<ResumeStatusResponse>(
      stored ? { hasResume: true, ...stored } : { hasResume: false },
    );
  } catch (error) {
    console.error("[resume:GET]", error);
    return NextResponse.json<ResumeErrorResponse>(
      { error: "Could not read your stored resume." },
      { status: 500 },
    );
  }
}

/**
 * DELETE — remove the stored summary.
 *
 * Idempotent: clearResumeSummary swallows ENOENT, so deleting when nothing is
 * stored succeeds rather than 404ing. That's the correct semantic for DELETE,
 * and it means the UI doesn't need to check before calling.
 *
 * Returns the same shape GET would return afterwards, so the client can set its
 * state straight from the response instead of refetching.
 */
export async function DELETE() {
  try {
    await clearResumeSummary();
    return NextResponse.json<ResumeStatusResponse>({ hasResume: false });
  } catch (error) {
    console.error("[resume:DELETE]", error);
    return NextResponse.json<ResumeErrorResponse>(
      { error: "Could not remove your stored resume." },
      { status: 500 },
    );
  }
}
