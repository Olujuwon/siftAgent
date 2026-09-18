/**
 * PURPOSE
 * One place that decides whether we run for real or in demo mode.
 *
 * WHY
 * The deployed portfolio instance has no API keys and must still work — a
 * recruiter should be able to click through the whole flow. Locally, .env.local
 * supplies keys and the same code path uses them.
 *
 * So every integration point asks here rather than reading process.env itself.
 * Scattered `if (process.env.X)` checks drift; this doesn't.
 *
 * GOTCHAS
 * - Server-only values. These are NOT NEXT_PUBLIC_, so they're undefined in the
 *   browser. page.tsx is a Server Component and reads them there, then passes
 *   the booleans down as props.
 * - Read at module load. Adding a key to .env.local needs a server restart.
 */

/** Real Claude calls in summarizeResume, scoreFit and draftLetter. */
export const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);

/** Real Tavily calls in search() and extract(). */
export const hasTavilyKey = Boolean(process.env.TAVILY_API_KEY);

/** True when anything is faked — drives the banner in the UI. */
export const isDemoMode = !hasAnthropicKey || !hasTavilyKey;
