import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiftAgent",
  description: "Job posting triage: fit score plus a cover letter opener.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* Plain utility classes only — real styling comes once the graph works. */}
      <body className="mx-auto max-w-2xl px-6 py-10">{children}</body>
    </html>
  );
}
