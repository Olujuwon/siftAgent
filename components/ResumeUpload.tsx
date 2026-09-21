"use client";

/**
 * PURPOSE
 * Paste a CV, see the summary the agent will actually score against, remove it.
 *
 * STATUS
 * Both input paths work: upload a PDF, or paste text.
 *
 * WHY SHOW THE SUMMARY RATHER THAN A CHECKMARK
 * It is the only point at which a wrong summary is catchable. Unseen, a summary
 * that invented experience would skew every later triage, and the output would
 * look perfectly plausible.
 *
 * GOTCHAS
 * - ResumeStatusResponse is a discriminated union. Check `hasResume` before
 *   touching `summary` — TypeScript enforces it, which is the point.
 * - The mount fetch aborts on unmount, or a slow response sets state on a
 *   component that is gone.
 * - Two POST shapes: the paste box sends JSON, the file input sends FormData.
 *   On the FormData one you must NOT set Content-Type — the browser has to set
 *   it to include the multipart boundary.
 * - `accept` only filters the file picker. The server checks magic bytes,
 *   because filename and MIME type are both client-controlled.
 */

import { useEffect, useState } from "react";
import { CircleX, Eye, Loader2, Upload } from "lucide-react";

import { ErrorComponent } from "@/components/ErrorComponent";
import { Modal } from "@/components/Modal";
import type {
  ResumeErrorResponse,
  ResumeStatusResponse,
  ResumeUploadRequest,
  ResumeUploadResponse,
} from "@/lib/types";

type ResumeUploadProps = {
  /** Called whenever the stored CV changes, so a parent can react. */
  onChange?: (status: ResumeStatusResponse) => void;
};

async function readError(response: Response, fallback: string): Promise<string> {
  // .catch(() => null) guards a non-JSON body, e.g. a proxy error page.
  const body = (await response
    .json()
    .catch(() => null)) as ResumeErrorResponse | null;
  return body?.error ?? fallback;
}

/**
 * Size of the stored summary, so the word cap in summarize.ts can be tuned
 * against real output instead of guessed at.
 *
 * The token figure is an ESTIMATE — roughly 4 characters per token for English
 * prose. Real tokenisation varies with punctuation and rare words; the exact
 * count needs the provider's count_tokens endpoint, which isn't worth a network
 * call here. It's the right order of magnitude for deciding whether the cap
 * is too tight.
 */
function SummarySize({ summary }: { summary: string }) {
  const characters = summary.length;
  const words = summary.trim().split(/\s+/).filter(Boolean).length;
  const estimatedTokens = Math.round(characters / 4);

  return (
    <p className="border-t border-gray-200 pt-2 text-xs text-gray-500 dark:border-gray-800">
      {characters.toLocaleString()} characters · {words.toLocaleString()} words ·
      ~{estimatedTokens.toLocaleString()} tokens (estimate)
    </p>
  );
}

export function ResumeUpload({ onChange }: ResumeUploadProps) {
  const [status, setStatus] = useState<ResumeStatusResponse | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  // Tracked separately from `status`. Using `status === null` to mean "loading"
  // conflates it with "the mount fetch failed", and that left the component
  // with no branch to render — dismissing the error showed Loading… forever.
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/resume", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readError(response, "Could not load your CV."));
        setStatus((await response.json()) as ResumeStatusResponse);
      })
      .catch((cause: unknown) => {
        // An abort is the component unmounting, not a failure.
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Could not load your CV.");
      })
      .finally(() => setIsLoadingStatus(false));

    return () => controller.abort();
  }, []);

  // Report every status change upward, including the one from the mount fetch.
  // Firing onChange only from the save/remove handlers meant a CV that already
  // existed was never announced, so the parent kept the job form disabled.
  useEffect(() => {
    if (status) onChange?.(status);
  }, [status, onChange]);

  /**
   * Posts the file as multipart FormData.
   *
   * No Content-Type header — the browser MUST set it itself, because it has to
   * include the multipart boundary. Setting it by hand is the classic way to
   * get an unhelpful parse failure on the server.
   */
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    // Reset immediately so picking the same file twice still fires onChange.
    event.currentTarget.value = "";
    if (!file) return;

    setError(null);
    setIsBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resume", { method: "POST", body: formData });
      if (!response.ok) throw new Error(await readError(response, "Could not read that PDF."));

      const saved = (await response.json()) as ResumeUploadResponse;
      setStatus({ hasResume: true, ...saved });
      setResumeText("");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not read that PDF.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText } satisfies ResumeUploadRequest),
      });
      if (!response.ok) throw new Error(await readError(response, "Could not save your CV."));

      const saved = (await response.json()) as ResumeUploadResponse;
      setStatus({ hasResume: true, ...saved });
      setResumeText("");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not save your CV.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setIsBusy(true);
    try {
      const response = await fetch("/api/resume", { method: "DELETE" });
      if (!response.ok) throw new Error(await readError(response, "Could not remove your CV."));
      setStatus((await response.json()) as ResumeStatusResponse);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not remove your CV.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-md border border-gray-300 p-4 dark:border-gray-700">
      <h2 className="text-sm font-medium">Your CV</h2>

      {isLoadingStatus && <p className="text-sm text-gray-500">Loading…</p>}

      {status?.hasResume && (
        <>
          {/*
            Collapsed to one line on purpose. The summary is long, and once
            stored you rarely need to read it — but you must be able to, since
            this is the only place a wrong summary is catchable.
          */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span className="text-xs text-gray-500">
              Saved {new Date(status.updatedAt).toLocaleDateString()} · from{" "}
              {status.sourceFilename}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSummaryOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
              >
                <Eye className="size-3.5" aria-hidden="true" />
                View summary
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-900"
              >
                {isBusy ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <CircleX className="size-3.5" aria-hidden="true" />
                )}
                Remove
              </button>
            </div>
          </div>

          <Modal
            open={isSummaryOpen}
            onClose={() => setIsSummaryOpen(false)}
            title="What the agent scores against"
          >
            <div className="flex flex-col gap-3">
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {status.summary}
              </p>
              <SummarySize summary={status.summary} />
            </div>
          </Modal>
        </>
      )}

      {!isLoadingStatus && !status?.hasResume && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="resume-file"
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900 ${
                isBusy ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <Upload className="size-3.5" aria-hidden="true" />
              Upload PDF
            </label>
            {/*
              `accept` only filters the file picker — the server still checks
              the magic bytes, since filename and MIME type are both
              client-controlled.
            */}
            <input
              id="resume-file"
              type="file"
              accept="application/pdf"
              disabled={isBusy}
              onChange={handleFileChange}
              className="sr-only"
            />
            <span className="text-xs text-gray-500">or paste it below</span>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-3">
          <label htmlFor="resume-text" className="text-sm text-gray-600 dark:text-gray-400">
            Paste your CV. It is summarised once and reused for every triage.
          </label>
          <textarea
            id="resume-text"
            rows={6}
            value={resumeText}
            onChange={(event) => setResumeText(event.currentTarget.value)}
            disabled={isBusy}
            placeholder="Paste your CV text here"
            className="w-full rounded-md border border-gray-300 p-3 font-mono text-sm dark:border-gray-700 dark:bg-transparent"
          />
          <button
            type="submit"
            disabled={isBusy || resumeText.trim() === ""}
            className="inline-flex items-center justify-center gap-2 self-start rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900"
          >
            {isBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isBusy ? "Saving" : "Save CV"}
          </button>
          </form>
        </>
      )}

      {error && <ErrorComponent message={error} onDismiss={() => setError(null)} />}
    </section>
  );
}
