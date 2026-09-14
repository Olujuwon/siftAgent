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

import { readFile, writeFile, unlink, rename } from "node:fs/promises";
import path from "node:path";

export const RESUME_SUMMARY_PATH = ".resume-summary.local.json";

export type StoredResumeSummary = {
  summary: string;
  /** ISO timestamp, so the UI can show "uploaded 3 weeks ago". */
  updatedAt: string;
  /** Display only. Never used as a path. */
  sourceFilename: string;
};

/**
 * fs paths resolve against process.cwd(), NOT this module's directory. Under
 * `next dev` that's the repo root, but joining makes it explicit rather than
 * dependent on where the server happened to start.
 */
function summaryPath(): string {
  return path.join(process.cwd(), RESUME_SUMMARY_PATH);
}

/**
 * `catch (error)` gives you `unknown` under strict TS, so you cannot reach
 * `error.code` without narrowing first. Both read and clear need this check,
 * hence a helper.
 */
function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "ENOENT"
  );
}

export async function readResumeSummary(): Promise<StoredResumeSummary | null> {
  let raw: string;

  try {
    // Without "utf8" this returns a Buffer, not a string.
    raw = await readFile(summaryPath(), "utf8");
  } catch (error) {
    // No file yet is the normal first-run state, not a failure.
    if (isMissingFileError(error)) return null;
    // Anything else — permissions, a directory in the way — is real. Let it out.
    throw error;
  }

  try {
    return JSON.parse(raw) as StoredResumeSummary;
  } catch {
    // Deliberately NOT null. Returning null here would send the user off to
    // re-upload when the actual problem is a corrupt file on disk.
    throw new Error(
      `${RESUME_SUMMARY_PATH} exists but is not valid JSON. Delete it and re-upload.`,
    );
  }
}

/**
 * Writes to a temp file, then renames it over the real one. rename() is atomic
 * within a filesystem, so a crash mid-write can't leave a half-written file —
 * which readResumeSummary would then throw on for every subsequent request.
 *
 * No ENOENT handling here: writeFile creates the file if it's absent.
 */
export async function writeResumeSummary(
  value: StoredResumeSummary,
): Promise<void> {
  const target = summaryPath();
  const temp = `${target}.tmp`;

  await writeFile(temp, JSON.stringify(value, null, 2), "utf8");

  try {
    await rename(temp, target);
  } catch (error) {
    // Don't leave the temp file behind if the rename failed.
    await unlink(temp).catch(() => {});
    throw error;
  }
}

/** Deleting a file that isn't there is a success, not a failure. */
export async function clearResumeSummary(): Promise<void> {
  try {
    await unlink(summaryPath());
  } catch (error) {
    if (isMissingFileError(error)) return;
    throw error;
  }
}
