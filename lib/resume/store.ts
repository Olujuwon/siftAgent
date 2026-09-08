/**
 * PURPOSE
 * Cache the computed resume summary between requests, so it isn't regenerated
 * on every triage.
 *
 * STATUS
 * STUB.
 *
 * EXPORTS
 * - RESUME_SUMMARY_PATH             where it lives
 * - StoredResumeSummary             the cached shape
 * - readResumeSummary()  -> value | null
 * - writeResumeSummary(value)
 * - clearResumeSummary()
 *
 * WHY A FILE
 * Phase 1 rules out a database, but the summary must outlive the upload request
 * or the caching is pointless. One gitignored JSON file: no dependency, no
 * service, survives a restart. Phase 2's SQLite replaces it — keep this
 * interface at three functions so the swap stays contained.
 *
 * PII
 * - This file holds real resume-derived data. Gitignored. Never commit it,
 *   never rename it outside the ignore pattern, never log its contents.
 * - The uploaded PDF is never written to disk at all. Parsed in memory, only
 *   the summary is kept.
 *
 * GOTCHAS
 * - read: return null on a missing file. "No resume yet" is a normal first-run
 *   state, not an error.
 * - read: but DO surface a JSON parse failure. Treating a corrupt file as "no
 *   resume" sends the user to re-upload for no reason.
 * - write: consider temp-file-then-rename, so an interrupted write can't leave
 *   a half-written file that fails every subsequent read.
 * - clear: ignore ENOENT.
 * - Path is relative to process.cwd(), i.e. the repo root under `next dev`.
 */

import "server-only";

// TODO: import { readFile, writeFile, unlink } from "node:fs/promises";

export const RESUME_SUMMARY_PATH = ".resume-summary.local.json";

export type StoredResumeSummary = {
  summary: string;
  /** ISO timestamp, so the UI can show "uploaded 3 weeks ago". */
  updatedAt: string;
  /** Display only. Never used as a path. */
  sourceFilename: string;
};

export async function readResumeSummary(): Promise<StoredResumeSummary | null> {
  throw new Error("readResumeSummary not implemented");
}

export async function writeResumeSummary(
  value: StoredResumeSummary,
): Promise<void> {
  throw new Error("writeResumeSummary not implemented");
}

export async function clearResumeSummary(): Promise<void> {
  throw new Error("clearResumeSummary not implemented");
}
