"use client";

/**
 * PURPOSE
 * A modal built on the native <dialog> element. No dependency.
 *
 * WHY <dialog> RATHER THAN A DIV
 * showModal() gives you, for free, the parts people get wrong by hand:
 * - focus is trapped inside while open, and restored to the trigger on close
 * - Escape closes it
 * - the rest of the page becomes inert to screen readers
 * - ::backdrop is a real pseudo-element, so no overlay div
 *
 * GOTCHAS
 * - showModal() is imperative, so it has to run in an effect against a ref.
 *   Rendering <dialog open> instead gives you a NON-modal dialog: no focus
 *   trap, no backdrop, no Escape.
 * - Escape bypasses your onClose, so listen for the element's own "close"
 *   event — otherwise React state says open while the DOM says shut.
 * - The backdrop is part of the dialog, so a click on it lands on the <dialog>
 *   itself. Comparing event.target to the dialog is how you detect it.
 */

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Fires for Escape too, which never touches our onClose otherwise.
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      // A backdrop click reports the dialog as the target; anything inside
      // reports that child instead.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[min(40rem,calc(100vw-2rem))] rounded-lg bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/40 dark:bg-gray-950 dark:text-gray-100"
    >
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h2 className="text-sm font-medium">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
    </dialog>
  );
}
