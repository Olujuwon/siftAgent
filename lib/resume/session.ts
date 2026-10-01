/**
 * PURPOSE
 * Identify the visitor, so one visitor's CV is not another's.
 *
 * WHY
 * The store used to hold ONE summary for the whole server process. On a shared
 * deployment that means visitor A uploads a CV and visitor B sees it in "View
 * summary", and B's Remove deletes it for A. Keyless that leaks A's filename,
 * which usually contains their name; with real keys it would leak A's whole CV
 * summary.
 *
 * NOT AUTH
 * An opaque id in a cookie, nothing more. It separates visitors; it does not
 * prove who anyone is. Anyone holding the cookie is that session.
 *
 * GOTCHAS
 * - cookies() can only be SET from a Route Handler or Server Action. Reading
 *   works anywhere; calling ensureSessionId() from a Server Component throws.
 * - In Next 16 cookies() is async. Await it.
 */

import "server-only";

import { cookies } from "next/headers";

export const SESSION_COOKIE = "sift_sid";

/** 30 days. Long enough that a CV outlives a browser restart. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** The visitor's id, or null if they don't have one yet. Safe to read anywhere. */
export async function getSessionId(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/**
 * The visitor's id, creating and setting one if needed.
 *
 * ROUTE HANDLERS ONLY — see GOTCHAS.
 *
 * httpOnly: the browser never needs to read this, and JavaScript that can't
 * reach it can't leak it. sameSite lax: no cross-site request should carry it.
 * secure in production only, or it would be dropped over plain http locally.
 */
export async function ensureSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  store.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return sessionId;
}
