"use client";

/**
 * PURPOSE
 * Tells visitors the deployed instance runs on sample data, and explains
 * precisely what is real and what isn't.
 *
 * WHY IT MATTERS
 * Without it a recruiter reads "Fake content 1. Pretend this says something
 * useful" and concludes that's the output quality. Naming the boundary turns a
 * limitation into evidence the degradation was designed.
 *
 * WHY A MODAL
 * The page is meant to fit on one screen. A paragraph here would push the panes
 * down on every view; a line plus an opt-in modal costs one row.
 */

import { useState } from "react";
import { FlaskConical } from "lucide-react";

import { Modal } from "@/components/Modal";

type DemoBannerProps = {
  hasAnthropicKey: boolean;
  hasTavilyKey: boolean;
};

export function DemoBanner({ hasAnthropicKey, hasTavilyKey }: DemoBannerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sampled = [
    !hasAnthropicKey && "fit scoring, CV summarising and letter drafting",
    !hasTavilyKey && "company research",
  ].filter(Boolean) as string[];

  if (sampled.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
          Demo mode
        </span>
        <span>Running on sample data — no API keys configured.</span>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="ml-auto shrink-0 underline underline-offset-2 hover:no-underline"
        >
          What&rsquo;s real?
        </button>
      </div>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="What's real in this demo"
      >
        <div className="flex flex-col gap-4 text-sm text-gray-700 dark:text-gray-300">
          <p>
            SiftAgent reads a job posting, researches the company, scores it
            against a CV, and drafts a cover letter opener. It&rsquo;s built on a{" "}
            <strong>LangGraph</strong> state graph with a real conditional edge:
            if the fit score comes back uncertain, control loops back to the
            research node with a different query angle, capped at three passes.
          </p>

          <div>
            <h3 className="mb-1 font-medium text-gray-900 dark:text-gray-100">
              Real, and running right now
            </h3>
            <ul className="list-inside list-disc space-y-0.5">
              <li>The graph: four nodes, the conditional edge, the loop</li>
              <li>
                State channels and reducers — watch the research results
                accumulate across passes rather than overwrite
              </li>
              <li>The attempts cap that stops the loop</li>
              <li>PDF parsing, CV storage, and the whole UI</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-medium text-gray-900 dark:text-gray-100">
              Sampled in this deployment
            </h3>
            <ul className="list-inside list-disc space-y-0.5">
              {sampled.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-2">
              Those are the parts that cost money per request. The deployed
              instance carries no keys so it stays free to run and safe to share
              — the code paths are identical, only the callers are stubbed.
            </p>
          </div>

          <p className="text-xs text-gray-500">
            Clone it, add an Anthropic and a Tavily key to{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-900">
              .env.local
            </code>
            , and the same code runs against live models.
          </p>
        </div>
      </Modal>
    </>
  );
}
