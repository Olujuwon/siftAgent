"use client";

import { Check, Copy } from "lucide-react";
// TODO: import { useState } from "react";

/**
 * Copy-to-clipboard button. Swaps to a checkmark briefly after a successful copy.
 *
 * STUB — the icons and markup are wired, the behaviour is yours.
 *
 * Why this is its own file rather than living inside TriageResult: clipboard
 * access needs state and an event handler, so it has to be a Client Component.
 * Isolating it here keeps TriageResult a Server Component. That's the same
 * "push the boundary down" idea as TriagePanel — only the button ships to the
 * browser, not the whole result view.
 *
 * It'll also get reused in Phase 2 for copying generated cover letters off the
 * /jobs list.
 *
 * What to implement:
 *
 * 1. `const [isCopied, setIsCopied] = useState(false)`
 * 2. On click: `await navigator.clipboard.writeText(value)`, set isCopied true,
 *    then reset it after ~2s so the button doesn't stay stuck on the checkmark.
 * 3. Clear that timer on unmount, or you'll set state on an unmounted component
 *    if the user navigates away inside the 2s window.
 * 4. `navigator.clipboard` is undefined on insecure origins and can reject if
 *    permission is denied — wrap it. localhost counts as secure, so this won't
 *    show up in dev, only once deployed somewhere without HTTPS.
 */

type CopyButtonProps = {
  /** The text to put on the clipboard. */
  value: string;
  /** Accessible label. Defaults to something generic. */
  label?: string;
};

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  // TODO: const [isCopied, setIsCopied] = useState(false);
  // TODO: async function handleCopy() { ... }

  const isCopied = false;

  return (
    <button
      type="button"
      // TODO: onClick={handleCopy}
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
