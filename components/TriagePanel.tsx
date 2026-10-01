"use client";

/**
 * PURPOSE
 * Owns the result state and lays out the two panes: inputs left, result right.
 *
 * WHY NOT PUT THIS STATE IN page.tsx
 * That would need "use client" on the page. Standard Next.js guidance is to push
 * the client boundary as far DOWN as it goes, so page.tsx stays a Server
 * Component and only this subtree ships.
 *
 * LAYOUT
 * Desktop: two columns filling the viewport, each scrolling internally so the
 * page itself never scrolls. Mobile: one column, normal page scroll, and the
 * result is scrolled into view when it arrives — otherwise it lands below the
 * fold and looks like nothing happened.
 *
 * min-h-0 / min-w-0 appear throughout on purpose. A flex or grid child defaults
 * to min-size:auto, meaning it will not shrink below its content — which
 * silently defeats every `overflow-y-auto` inside it.
 *
 * The two PANES get lg:min-h-0, not min-h-0. On mobile they don't scroll
 * themselves, the grid does. With min-h-0 there, the grid squeezes both rows
 * into its own height and the result row draws over the inputs.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { JobForm } from "@/components/JobForm";
import { ResumeUpload } from "@/components/ResumeUpload";
import { TriageResult } from "@/components/TriageResult";
import type { ResumeStatusResponse, TriageResponse } from "@/lib/types";

export function TriagePanel() {
  const [result, setResult] = useState<TriageResponse | null>(null);
  // Starts false so the job form is disabled until ResumeUpload's mount fetch
  // confirms a CV exists. /api/triage returns 400 without one.
  const [hasResume, setHasResume] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // useCallback keeps this identity stable across renders. ResumeUpload has it
  // in an effect's dependency array, so an inline arrow — recreated every
  // render — would re-run that effect on every render.
  const handleResumeChange = useCallback((status: ResumeStatusResponse) => {
    setHasResume(status.hasResume);
  }, []);

  useEffect(() => {
    if (!result) return;

    // Desktop already shows the result pane without scrolling, and scrolling
    // there would fight the internal panes. Only mobile needs this.
    const isNarrow = window.matchMedia("(max-width: 1023px)").matches;
    if (!isNarrow) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    resultRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [result]);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
      {/* Inputs */}
      <div className="flex lg:min-h-0 min-w-0 flex-col gap-4 lg:overflow-y-auto lg:pr-1">
        <ResumeUpload onChange={handleResumeChange} />

        {/*
          A disabled <fieldset> disables every form control inside it, including
          ones rendered by a child component — so JobForm needs no `disabled`
          prop and stays unchanged. min-w-0 counteracts fieldset's default
          min-width, which otherwise breaks the grid.
        */}
        <fieldset disabled={!hasResume} className="min-w-0">
          {!hasResume && (
            <p className="mb-2 text-sm text-gray-500">
              Add your CV above before triaging a posting.
            </p>
          )}
          <JobForm onResult={setResult} />
        </fieldset>
      </div>

      {/* Result */}
      <div
        ref={resultRef}
        className="flex lg:min-h-0 min-w-0 flex-col lg:overflow-y-auto lg:pl-1"
      >
        {result ? (
          <TriageResult result={result} />
        ) : (
          <div className="flex h-full min-h-40 items-center justify-center rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
            Your fit score and letter opener will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
