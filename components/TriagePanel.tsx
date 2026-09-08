"use client";

/**
 * PURPOSE
 * Owns the result state and wires JobForm to TriageResult. Small on purpose —
 * it exists only to hold one piece of state both children need.
 *
 * STATUS
 * STUB.
 *
 * WHY NOT PUT THIS STATE IN page.tsx
 * That would need "use client" on the page. Standard Next.js guidance is to push
 * the client boundary as far DOWN as it goes, so page.tsx stays a Server
 * Component and only this subtree ships. Negligible today; it stops being
 * negligible when page.tsx does server work — reading the resume summary off
 * disk, or querying the jobs table in Phase 2.
 *
 * STEPS
 * 1. const [result, setResult] = useState<TriageResponse | null>(null)
 * 2. Pass setResult to JobForm's onResult.
 * 3. Render TriageResult only when result is non-null:
 *      {result && <TriageResult result={result} />}
 * 4. Later: mount <ResumeUpload /> above <JobForm />, since a missing resume
 *    blocks triage.
 *
 * TODO: import { useState } from "react";
 * TODO: import { TriageResult } from "@/components/TriageResult";
 * TODO: import type { TriageResponse } from "@/lib/types";
 */

import { JobForm } from "@/components/JobForm";

export function TriagePanel() {
  return (
    <>
      <JobForm onResult={() => {}} />
    </>
  );
}
