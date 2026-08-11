"use client";

import {FC} from "react";
import {CircleX} from "lucide-react";

export interface ErrorComponentProps  {
    message: string;
    //type?: 'full' | 'toast';
    onDismiss?: () => void;
}

export const ErrorComponent:FC<ErrorComponentProps> = ({message, onDismiss}) => {
  return (
    <div className="bg-gray-100 rounded px-2 py-2 flex justify-between">
      <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
        {message}
      </p>
        {onDismiss && (
            <button type="button" onClick={onDismiss} aria-label="Dismiss error"
                    className="cursor-pointer text-red-600">
                <CircleX size={20} color='#DC2626' aria-hidden="true" />
            </button>
        )}
    </div>
  );
}
