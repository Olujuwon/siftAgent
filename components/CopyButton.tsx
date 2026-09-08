"use client";

/**
 * PURPOSE
 * Copy-to-clipboard button. Swaps to a checkmark briefly after a copy.
 *
 * STATUS
 * STUB. Icons and markup wired, behaviour is yours.
 *
 * WHY ITS OWN FILE
 * Clipboard access needs state and a handler, so this must be a Client
 * Component. Isolating it keeps TriageResult a Server Component — same
 * "push the boundary down" idea as TriagePanel. Reused in Phase 2 for copying
 * letters off the /jobs list.
 *
 * STEPS
 * 1. const [isCopied, setIsCopied] = useState(false)
 * 2. On click: await navigator.clipboard.writeText(value), set true.
 * 3. Reset after ~2s.
 * 4. Clear the timer on unmount.
 *
 * GOTCHAS
 * - Without step 4 you set state on an unmounted component if the user
 *   navigates away inside the 2s window.
 * - navigator.clipboard is undefined on insecure origins and can reject if
 *   permission is denied. Wrap it. localhost counts as secure, so this only
 *   shows up once deployed without HTTPS.
 */

import { Check, Copy } from "lucide-react";

type CopyButtonProps = {
  /** The text to put on the clipboard. */
  value: string;
  /** Accessible label. */
  label?: string;
};

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const isCopied = false;

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
    >
      {isCopied ? (
        <Check className="size-3.5 text-green-600" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      {isCopied ? "Copied" : label}
    </button>
  );
}
