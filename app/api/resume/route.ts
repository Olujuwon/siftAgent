/**
 * PURPOSE
 * The one-off resume setup endpoint. Runs when your resume changes, not per
 * triage.
 *
 * STATUS
 * Both input paths work. summarizeResume is still a fake.
 *
 * ROUTES
 * - POST   /api/resume   store a summary of pasted CV text
 * - GET    /api/resume   report whether a summary exists
 * - DELETE /api/resume   remove the stored summary
 *
 * PIPELINE
 *   JSON  { resumeText }      -> summarizeResume() -> writeResumeSummary()
 *   multipart FormData "file" -> parsePdf() -> summarizeResume() -> write
 *
 * The two paths are told apart by Content-Type, and converge in extractResume.
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

import { MAX_PDF_BYTES, PdfParseError, parsePdf } from "@/lib/resume/parsePdf";
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

/** What the two input paths produce, before summarising. */
type ExtractedResume = { text: string; sourceFilename: string };

/**
 * Pull CV text out of the request, whichever way it arrived.
 *
 * Returns a Response on failure rather than throwing, so the caller can return
 * it directly with the right status. PdfParseError messages are written for the
 * user and safe to forward; nothing else is.
 */
async function extractResume(
  request: Request,
): Promise<ExtractedResume | Response> {
  const contentType = request.headers.get("content-type") ?? "";

  // ── PDF path ──
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json<ResumeErrorResponse>(
        { error: "No file received." },
        { status: 400 },
      );
    }

    // Checked before reading bytes — file.size is known up front, so an
    // oversized upload never reaches memory.
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json<ResumeErrorResponse>(
        { error: "That PDF is too large. The limit is 5MB." },
        { status: 413 },
      );
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return { text: await parsePdf(bytes), sourceFilename: file.name };
    } catch (error) {
      console.error("[resume:pdf]", error);
      return NextResponse.json<ResumeErrorResponse>(
        {
          error:
            error instanceof PdfParseError
              ? error.message
              : "That PDF could not be read.",
        },
        { status: 400 },
      );
    }
  }

  // ── Text path ──
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

  return { text: resumeText, sourceFilename: "pasted text" };
}

export async function POST(request: Request) {
  const extracted = await extractResume(request);
  if (extracted instanceof Response) return extracted;

  try {
    const stored = {
      summary: await summarizeResume(extracted.text),
      updatedAt: new Date().toISOString(),
      sourceFilename: extracted.sourceFilename,
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
