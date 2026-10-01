"use client";

/**
 * PURPOSE
 * Shows what the research node actually found, grouped by loop pass.
 *
 * WHY GROUPED BY PASS
 * "3 research passes" is a claim; this is the evidence. Grouping by pass makes
 * the loop visible — you can see each pass used a different query angle, and
 * that results accumulated rather than replaced. If every pass shows the same
 * angle, the loop is spinning without learning anything.
 */

import { useState } from "react";
import { Microscope } from "lucide-react";

import { Modal } from "@/components/Modal";
import type { NodeTiming, SearchResult } from "@/lib/types";

type ResearchModalProps = {
  /** Shown so a wrong identification is catchable before you trust the score. */
  company?: string | null;
  searchResults?: SearchResult[];
  timings?: NodeTiming[];
  durationMs?: number;
  attempts: number;
};

function formatMs(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function ResearchModal({
  // Defaulted because this is a wire boundary: an older cached response, or a
  // partial one, can arrive without these. A missing field should not take the
  // whole result view down.
  company,
  searchResults = [],
  timings = [],
  durationMs = 0,
  attempts,
}: ResearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Group by attempt: each entry is one trip round the loop.
  const passes = new Map<number, SearchResult[]>();
  for (const result of searchResults) {
    passes.set(result.attempt, [...(passes.get(result.attempt) ?? []), result]);
  }

  // Same node can appear several times; total per node is what you tune against.
  const perNode = new Map<string, { calls: number; totalMs: number }>();
  for (const { node, durationMs: ms } of timings) {
    const previous = perNode.get(node) ?? { calls: 0, totalMs: 0 };
    perNode.set(node, { calls: previous.calls + 1, totalMs: previous.totalMs + ms });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 underline underline-offset-2 hover:no-underline"
      >
        <Microscope className="size-3.5" aria-hidden="true" />
        {attempts} research {attempts === 1 ? "pass" : "passes"} ·{" "}
        {formatMs(durationMs)}
      </button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Research and timing">
        <div className="flex flex-col gap-5 text-sm">
          <p className="rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-900">
            {company ? (
              <>
                Researched <span className="font-medium">{company}</span>. If
                that&rsquo;s the wrong company, the score is built on the wrong
                evidence.
              </>
            ) : (
              <>
                The posting doesn&rsquo;t name its employer, so no company
                research ran. The score is based on the posting alone.
              </>
            )}
          </p>

          <div>
            <h3 className="mb-2 font-medium">Where the time went</h3>
            <table className="w-full text-xs">
              <tbody>
                {[...perNode.entries()]
                  .sort((a, b) => b[1].totalMs - a[1].totalMs)
                  .map(([node, { calls, totalMs }]) => (
                    <tr key={node} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-1 font-mono">{node}</td>
                      <td className="py-1 text-gray-500">
                        {calls} {calls === 1 ? "call" : "calls"}
                      </td>
                      <td className="py-1 text-right tabular-nums">{formatMs(totalMs)}</td>
                    </tr>
                  ))}
                <tr>
                  <td className="py-1 font-medium">total</td>
                  <td />
                  <td className="py-1 text-right font-medium tabular-nums">
                    {formatMs(durationMs)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-medium">
              What it found ({searchResults.length} results)
            </h3>
            {passes.size === 0 && (
              <p className="text-gray-500">No research results.</p>
            )}
            {[...passes.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([attempt, results]) => (
                <div key={attempt} className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Pass {attempt + 1} — &ldquo;{results[0]?.queryAngle}&rdquo;
                  </p>
                  {results.map((result) => (
                    <div key={result.url} className="border-l-2 border-gray-200 pl-3 dark:border-gray-800">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm underline underline-offset-2 hover:no-underline"
                      >
                        {result.title}
                      </a>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {result.content}
                      </p>
                      <p className="text-xs text-gray-400">
                        relevance {result.relevance.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
