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

import { isDemoMode } from "@/lib/config";
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

/**
 * Set when the filesystem refuses writes — serverless hosts mount the app
 * read-only, and /tmp is per-instance and ephemeral anyway. Holding the summary
 * here keeps uploads working for the life of the process, which covers a
 * visitor's session on the demo deployment. Lost on restart, by design.
 *
 * Phase 2's database is the real answer; this is deliberate demo degradation.
 */
let inMemorySummary: StoredResumeSummary | null = null;

/** Read-only mount (serverless) or a permissions problem. */
function isReadOnlyError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  const { code } = error as { code: unknown };
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

/**
 * Seeded CV for the public demo. Returned when nothing is stored, so a visitor
 * lands on a working app instead of an empty form — they can triage a posting
 * immediately without pasting their own CV.
 *
 * ONLY in demo mode. On a real instance, nothing stored means nothing stored:
 * the user uploads their own CV and should never be scored against a sample.
 */
const DEMO_RESUME: StoredResumeSummary = {
  summary: [
    "PRIMARY STACK (production experience): React, Next.js, TypeScript, Node.js, Python, Django.",
    "SECONDARY (working knowledge): React Native, Laravel, testing frameworks.",
    "CAVEATS: Vue is side-project only — no production experience.",
    "Senior full-stack engineer, Helsinki. Owns frontend architecture, REST API design and CI/CD.",
    "[sample CV — upload or paste your own to replace it]",
  ].join("\n"),
  updatedAt: new Date(0).toISOString(),
  sourceFilename: "sample CV",
};

/** Nothing stored: a sample on the public demo, genuinely nothing otherwise. */
function emptyResult(): StoredResumeSummary | null {
  return isDemoMode ? DEMO_RESUME : null;
}

export async function readResumeSummary(): Promise<StoredResumeSummary | null> {
  if (inMemorySummary) return inMemorySummary;

  let raw: string;

  try {
    // Without "utf8" this returns a Buffer, not a string.
    raw = await readFile(summaryPath(), "utf8");
  } catch (error) {
    // No file yet is the normal first-run state, not a failure.
    if (isMissingFileError(error)) return emptyResult();
    // A read-only mount can also surface as EACCES/EPERM — same meaning here.
    if (isReadOnlyError(error)) return emptyResult();
    // Anything else — a directory in the way, say — is real. Let it out.
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

  try {
    await writeFile(temp, JSON.stringify(value, null, 2), "utf8");
    try {
      await rename(temp, target);
    } catch (error) {
      // Don't leave the temp file behind if the rename failed.
      await unlink(temp).catch(() => {});
      throw error;
    }
    inMemorySummary = null; // the file is now authoritative
  } catch (error) {
    if (!isReadOnlyError(error)) throw error;
    // Read-only filesystem: keep it in memory so the upload still works.
    inMemorySummary = value;
  }
}

/** Deleting a file that isn't there is a success, not a failure. */
export async function clearResumeSummary(): Promise<void> {
  inMemorySummary = null;
  try {
    await unlink(summaryPath());
  } catch (error) {
    if (isMissingFileError(error) || isReadOnlyError(error)) return;
    throw error;
  }
}
