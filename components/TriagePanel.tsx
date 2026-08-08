"use client";

import { JobForm } from "@/components/JobForm";
import { TriageResult } from "@/components/TriageResult";
// TODO: import type { TriageResponse } from "@/lib/types";

/**
 * Holds the result state and wires the form to the result view.
 *
 * STUB. Small on purpose — the only reason it exists is to own one piece of
 * state that both children need.
 *
 * Why not put this state in app/page.tsx? Because then `page.tsx` would need
 * "use client", and the standard Next.js guidance is to push the client
 * boundary as far DOWN the tree as it will go. Keeping `page.tsx` a Server
 * Component means the page shell, metadata, and any future server-rendered
 * content stay off the client bundle. Only this subtree ships.
 *
 * Right now the difference is negligible. It stops being negligible when
 * `page.tsx` starts doing server work — reading the resume summary off disk,
 * or in Phase 2, querying the jobs table.
 *
 * What to implement:
 *
 * 1. `const [result, setResult] = useState<TriageResponse | null>(null)`
 * 2. Pass `setResult` to JobForm's `onResult`.
 * 3. Render TriageResult only when `result` is non-null.
 */
export function TriagePanel() {
  // TODO: const [result, setResult] = useState<TriageResponse | null>(null);

  return (
    <>
      {/* TODO: onResult={setResult} */}
      <JobForm onResult={() => {}} />

      {/* TODO: {result && <TriageResult result={result} />} */}
      {false && <TriageResult result={{ fitScore: {}, letterDraft: "", attempts: 0 }} />}
    </>
  );
}
