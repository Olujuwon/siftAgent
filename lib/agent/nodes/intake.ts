/**
 * PURPOSE
 * NODE `intake` — first in the graph. Resolves jobInput into jobText, then
 * identifies the hiring company so research knows who to look up.
 *
 * EXPORTS
 * - intake(state) -> Partial<state>   sets jobText and company
 *
 * GOTCHAS
 * - URL input goes through Tavily Extract, not plain fetch — most job boards
 *   block fetch or return a JS shell with no content. extract() throws
 *   ExtractError on an unreadable page.
 * - company can be null. That's a real answer for recruiter listings, and the
 *   research node skips on it rather than searching for nothing.
 * - An early design note said this node needed no model call. That assumed it
 *   only resolved text; identifying the employer from arbitrary prose is the
 *   kind of fuzzy task a model does well and string matching does badly.
 */

import { z } from "zod/v4";

import { createModel } from "@/lib/ai/model";
import { hasAnthropicKey } from "@/lib/config";
import type { SiftStateType } from "../state";
import {extract} from "@/lib/agent/tools/search";

/**
 * The model reads the whole posting, up to this cap.
 *
 * An earlier version read only the first 1500 chars, assuming the employer is
 * named near the top. That holds for a job PAGE, where the name sits in the
 * header. Pasted text drops that header, and many postings then name the
 * company only in an "About <Company>" section at the end. A real Hoxhunt
 * posting first named them at char 2889, so intake returned null.
 *
 * A typical posting is ~1-1.5k tokens at low effort, so reading it all costs
 * very little. The cap only guards against an extracted page bloated with
 * navigation and footer text.
 */
const COMPANY_SCAN_CHARS = 20_000;

/**
 * Used when there is no Anthropic key. Demo research runs on fakes that just
 * echo the query, so any name works — this keeps the demo loop visible.
 */
const DEMO_COMPANY = "Example Co";

const companySchema = z.object({
  company: z
    .string()
    .nullable()
    .describe(
      "The hiring employer's name as written in the posting, or null if the posting does not name one.",
    ),
});

const COMPANY_PROMPT = `Identify the company that is hiring for this job posting.

Return the employer's name as the posting writes it.

Return null when the posting does not name the employer. Recruiter and agency
listings often don't, and that is a normal answer.

Never guess. A job board, a recruiting agency, or a website mentioned in
passing is not the employer. Returning null is far better than returning the
wrong company: the name is used to research the employer, so a wrong guess
sends every search after the wrong business.`;

async function identifyCompany(jobText: string): Promise<string | null> {
  if (!hasAnthropicKey) return DEMO_COMPANY;

  // Low effort: this is lookup, not judgement. maxTokens is a ceiling, not a
  // charge — you pay for what's used — so a generous one costs nothing and
  // avoids a truncated, unparseable response.
  const model = createModel({ maxTokens: 2000, effort: "low" }).withStructuredOutput(
    companySchema,
    { name: "company", method: "jsonSchema" },
  );

  const { company } = await model.invoke([
    { role: "system", content: COMPANY_PROMPT },
    { role: "user", content: jobText.slice(0, COMPANY_SCAN_CHARS) },
  ]);

  // Normalise an empty string to null, so callers only have one "none" case.
  return company?.trim() || null;
}

export async function intake(
  state: SiftStateType,
): Promise<Partial<SiftStateType>> {
  const jobText =
    state.jobInput.type === "text"
      ? state.jobInput.value
      : await extract(state.jobInput.value);

  const company = await identifyCompany(jobText);

  return { jobText, company };
}
