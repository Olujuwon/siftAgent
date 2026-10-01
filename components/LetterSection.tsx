"use client";

/**
 * PURPOSE
 * The cover letter area of a result. Shows the draft, or, when the graph paused
 * before drafting, a button that resumes it.
 *
 * WHY ITS OWN FILE
 * The button needs state and a fetch, so this is a Client Component. Same
 * "push the boundary down" idea as CopyButton: TriageResult stays a Server
 * Component and only this part ships to the browser.
 *
 * STATES
 * - letterDraft present     -> show it, with copy
 * - pending, not requested  -> explain why, offer the button
 * - requesting              -> button disabled, spinner
 * - failed                  -> error message, button stays so they can retry
 *
 * GOTCHAS
 * - A 404 means the paused run is gone (server restarted). Retrying won't help;
 *   the message tells them to triage again.
 * - Keyed by threadId in TriageResult, so a new triage resets this state rather
 *   than showing the previous result's letter.
 */

import { useState } from "react";
import { Loader2, PenLine } from "lucide-react";

import { CopyButton } from "@/components/CopyButton";
import { WORTH_APPLYING_SCORE } from "@/lib/constants";
import type { LetterResponse, TriageErrorResponse } from "@/lib/types";

type LetterSectionProps = {
  /** Set when the letter was drafted during triage. */
  initialDraft?: string;
  /** Resumes the paused run. */
  threadId: string;
  score: number;
};

export function LetterSection({ initialDraft, threadId, score }: LetterSectionProps) {
  const [letterDraft, setLetterDraft] = useState(initialDraft);
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestDraft() {
    setIsDrafting(true);
    setError(null);
    try {
      const response = await fetch("/api/triage/letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      });
      const body = (await response.json()) as LetterResponse | TriageErrorResponse;
      if (!response.ok || "error" in body) {
        setError("error" in body ? body.error : "Drafting failed. Please try again.");
        return;
      }
      setLetterDraft(body.letterDraft);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsDrafting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">Cover letter opener</h3>
        {letterDraft && <CopyButton value={letterDraft} label="Copy letter" />}
      </div>

      {letterDraft ? (
        <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {letterDraft}
        </p>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <p>
            Not drafted automatically: {score}/10 is below the {WORTH_APPLYING_SCORE}/10
            worth-applying mark. Draft one anyway if you still want to apply.
          </p>
          <button
            type="button"
            onClick={requestDraft}
            disabled={isDrafting}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium hover:bg-white disabled:opacity-60 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {isDrafting ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <PenLine className="size-3.5" aria-hidden="true" />
            )}
            {isDrafting ? "Drafting…" : "Draft cover letter"}
          </button>
          {error && (
            <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
