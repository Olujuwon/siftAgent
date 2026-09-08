/**
 * PURPOSE
 * Extract plain text from an uploaded resume PDF.
 *
 * STATUS
 * STUB. Blocked on a Node upgrade — see PREREQUISITE.
 *
 * EXPORTS
 * - parsePdf(bytes) -> string
 *
 * PREREQUISITE: NODE VERSION
 * Every maintained parser needs newer Node than v20.13.1 (what this repo was
 * scaffolded on):
 *   unpdf@1.8.0         >=22
 *   pdf-parse@2.4.5     >=20.16.0 <21 || >=22.3.0
 *   pdfjs-dist@6.2.108  >=22.13.0
 *
 * `nvm install 22` unlocks all three (Next 16 needs only >=20.9.0).
 * pdf-parse@1.1.1 runs anywhere but is unmaintained since 2019.
 * After switching, update the hardcoded node path in .claude/launch.json.
 *
 * STEPS
 * 1. Validate magic bytes (`%PDF-`), not the filename or client MIME type.
 * 2. Cap size at ~5MB.
 * 3. Extract text.
 * 4. Throw if the result is empty or whitespace-only.
 *
 * GOTCHAS
 * - Bytes in, string out. No file paths — the route has the upload in memory
 *   and the PDF must never touch disk (PII).
 * - Filename and MIME type are attacker-controlled. Magic bytes aren't.
 * - Scanned resumes are images with no text layer: the parser returns "" rather
 *   than failing. Without step 4 you hand "" to the summarizer and get a
 *   confidently invented summary. OCR is out of scope — tell the user.
 *
 * SKETCH
 *   TODO: pnpm add pdf-parse      (or unpdf, on Node 22)
 */

import "server-only";

export async function parsePdf(bytes: Uint8Array): Promise<string> {
  throw new Error("parsePdf not implemented");
}
