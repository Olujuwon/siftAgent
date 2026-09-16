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
      {/*
        h-dvh, not h-screen: 100vh is wrong on mobile browsers, where the
        address bar is counted in but then overlays the page. dvh tracks the
        actual visible area.
        overflow-hidden confines scrolling to the panes inside, so the page
        itself never scrolls on desktop. Mobile opts back out — see page.tsx.
      */}
      <body className="h-dvh overflow-hidden">{children}</body>
    </html>
  );
}
