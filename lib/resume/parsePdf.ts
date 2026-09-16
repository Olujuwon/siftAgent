/**
 * PURPOSE
 * Extract plain text from an uploaded resume PDF.
 *
 * EXPORTS
 * - PdfParseError            thrown for causes worth showing the user
 * - MAX_PDF_BYTES            size cap
 * - parsePdf(bytes) -> string
 *
 * NODE VERSION
 * pdf-parse@2 requires Node >=20.16 <21 or >=22.3. This repo runs on 22.
 *
 * GOTCHAS
 * - Validate magic bytes, not the filename or the client-sent MIME type. Both
 *   are attacker-controlled; the first five bytes are not.
 * - Scanned CVs are images with no text layer. The parser SUCCEEDS and returns
 *   an empty string rather than failing, so without an explicit check you hand
 *   "" to the summarizer and get a confidently invented summary back. OCR is
 *   out of scope — say so instead.
 * - Always destroy() the parser. It holds a pdfjs worker; leaking one per
 *   upload leaks memory in a long-running server.
 * - Bytes in, string out. The PDF is never written to disk — it's PII and
 *   nothing downstream needs it.
 */

import "server-only";

/**
 * pdf-parse is imported DYNAMICALLY, inside parsePdf, not at module level.
 *
 * It pulls in pdfjs, which inspects its environment at load time and throws
 * outright on the wrong Node version or when bundled. A top-level import makes
 * that failure take down every handler in whatever route imports this file —
 * GET and DELETE included, which have nothing to do with PDFs.
 *
 * Loading it at call time confines the blast radius to the PDF path.
 */
type PdfParseModule = typeof import("pdf-parse");

/** Distinguishes "the user's file is wrong" from "our code broke". */
export class PdfParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfParseError";
  }
}

/** A CV is a few hundred KB. 5MB is already generous. */
export const MAX_PDF_BYTES = 5 * 1024 * 1024;

/** Every PDF begins with these five bytes: %PDF- */
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d];

function looksLikePdf(bytes: Uint8Array): boolean {
  return PDF_MAGIC.every((byte, index) => bytes[index] === byte);
}

export async function parsePdf(bytes: Uint8Array): Promise<string> {
  if (bytes.byteLength > MAX_PDF_BYTES) {
    throw new PdfParseError("That PDF is too large. The limit is 5MB.");
  }

  if (!looksLikePdf(bytes)) {
    throw new PdfParseError("That file isn't a PDF.");
  }

  let PDFParse: PdfParseModule["PDFParse"];
  try {
    ({ PDFParse } = await import("pdf-parse"));
  } catch (cause) {
    // Almost always the environment: Node older than 22.3, or the package
    // getting bundled instead of required at runtime.
    console.error("[parsePdf] could not load pdf-parse", cause);
    throw new PdfParseError(
      "PDF support isn't available on this server right now. Paste your CV as text instead.",
    );
  }

  const parser = new PDFParse({ data: bytes });

  let text: string;
  try {
    ({ text } = await parser.getText());
  } catch {
    // Password-protected, truncated, malformed — all land here. The real cause
    // is logged by the caller; the user gets something they can act on.
    throw new PdfParseError(
      "That PDF could not be read. If it's password protected, remove the password and try again.",
    );
  } finally {
    await parser.destroy();
  }

  if (text.trim() === "") {
    throw new PdfParseError(
      "That PDF has no selectable text — it looks like a scan or an image. Paste your CV as text instead.",
    );
  }

  return text;
}
