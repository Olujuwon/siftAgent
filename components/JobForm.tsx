"use client";

import type { TriageResponse } from "@/lib/types";
import {useState} from "react";

/**
 * The input half of the UI: one textarea plus a submit button.
 *
 * STUB. Markup is a skeleton so the page renders; behaviour is yours.
 *
 * This is a Client Component ("use client" above) because it holds state and
 * handles events. That makes it the browser side of the boundary, so:
 *
 *   NEVER import from lib/agent/* here. Not the graph, not the nodes, not the
 *   Tavily wrapper. Those hold your API keys. `import "server-only"` in
 *   graph.ts and tools/search.ts will fail the build if you try, but the habit
 *   matters more than the guard.
 *
 * The only way to reach the agent is fetch("/api/triage").
 *
 * What to implement:
 *
 * 1. Local state: the textarea value, isLoading, and the error message.
 * 2. On submit: preventDefault, POST { jobInput } as TriageRequest to
 *    /api/triage, parse the JSON, hand the result up via onResult.
 * 3. Check `response.ok` before trusting the body. A 501 or 500 still returns
 *    JSON, but shaped like TriageErrorResponse, not TriageResponse.
 * 4. Disable the button while in flight and swap its label, or it's very easy to
 *    fire three concurrent agent runs by double-clicking.
 * 5. Reset the error on a new submit, so a stale failure doesn't sit there
 *    under a fresh successful result.
 *
 * A full run can take a while — the graph may loop through research more than
 * once, each pass being a search plus a model call. Streaming or per-node
 * progress would be a good second pass, once it works at all.
 */

type JobFormProps = {
  /** Called with the parsed response on a successful run. */
  onResult: (result: TriageResponse) => void;
};

export function JobForm({ onResult }: JobFormProps) {
  const [jobInput, setJobInput] = useState("");
  // TODO: const [isLoading, setIsLoading] = useState(false);
  // TODO: const [error, setError] = useState<string | null>(null);

  // TODO: async function handleSubmit(event: React.FormEvent) {
  //         event.preventDefault();
  //         setError(null); setIsLoading(true);
  //         try {
  //           const response = await fetch("/api/triage", {
  //             method: "POST",
  //             headers: { "Content-Type": "application/json" },
  //             body: JSON.stringify({ jobInput } satisfies TriageRequest),
  //           });
  //           if (!response.ok) { ...read TriageErrorResponse, setError, return }
  //           onResult(await response.json());
  //         } catch { setError("..."); }
  //         finally { setIsLoading(false); }
  //       }

  return (
    <form className="flex flex-col gap-3">
      <label htmlFor="job-input" className="text-sm font-medium">
        Job posting URL, or the posting text
      </label>
      <textarea
        id="job-input"
        rows={12}
        className="w-full rounded-md border border-gray-300 p-3 font-mono text-sm dark:border-gray-700 dark:bg-transparent"
        placeholder="https://... or paste the full posting"
        //value={jobInput} onChange={...} disabled={isLoading}
      />
      {/* TODO: disabled={isLoading || jobInput.trim() === ""}, label swaps to "Triaging..." */}
      <button
        type="submit"
        className="self-start rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900"
      >
        Triage
      </button>

      {/* TODO: {error && <p role="alert" className="text-sm text-red-600">{error}</p>} */}
    </form>
  );
}
