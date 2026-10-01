/**
 * Values shared between the browser and the server.
 *
 * Like lib/types.ts, this module imports nothing, so client components can use
 * it without pulling server code into the bundle.
 */

/**
 * The score at which a posting is "worth applying to".
 *
 * Used in three places that must agree: the score_fit prompt tells the model
 * what the number means, the result view labels it, and draft_letter decides
 * whether to write the letter automatically or wait to be asked. Defined once
 * so they can't drift.
 */
export const WORTH_APPLYING_SCORE = 7;
