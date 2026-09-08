/**
 * PURPOSE
 * The one-off resume setup endpoint. Runs when your resume changes, not per
 * triage.
 *
 * STATUS
 * STUB. Both handlers return 501.
 *
 * ROUTES
 * - POST /api/resume   upload a PDF, store its summary
 * - GET  /api/resume   report whether a summary exists
 *
 * PIPELINE
 *   FormData -> parsePdf() -> summarizeResume() -> writeResumeSummary()
 *
 * STEPS — POST
 * 1. await request.formData(), pull the file field. 400 if missing or not a File.
 * 2. Check file.size BEFORE reading bytes. ~5MB cap.
 * 3. parsePdf(new Uint8Array(await file.arrayBuffer())).
 * 4. summarizeResume(text), then writeResumeSummary({...}).
 * 5. Return the summary as ResumeUploadResponse.
 *
 * STEPS — GET
 * 1. readResumeSummary().
 * 2. null -> 200 { hasResume: false }. Not a 404.
 *
 * ERROR CODES
 * - 400  not a PDF, or no text layer. Say WHICH.
 * - 413  too large
 * - 502  model call failed
 *
 * GOTCHAS
 * - Never write the PDF to disk. PII, and nothing downstream needs it.
 * - Return the summary so the UI can display it. This is the ONLY point a
 *   hallucinated summary is catchable; unseen, it skews every later triage.
 * - "This looks like a scanned PDF with no text layer" is actionable.
 *   "Invalid file" is not.
 * - Never forward provider errors verbatim — they carry request IDs, URLs, and
 *   sometimes key fragments. Log the real one, return a generic one.
 * - No auth in Phase 1: this endpoint costs a model call and writes to disk.
 *   Fine on localhost, a reason not to deploy publicly as-is.
 */

import { NextResponse } from "next/server";

import type { ResumeErrorResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return NextResponse.json<ResumeErrorResponse>(
    { error: "Not implemented" },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json<ResumeErrorResponse>(
    { error: "Not implemented" },
    { status: 501 },
  );
}
