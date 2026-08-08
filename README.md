# SiftAgent

A LangGraph agent that takes a job posting and a resume summary, researches the
company, scores the fit against a real stack, and drafts a cover letter opener.

This is a learning project. The scaffold is here; the node logic, prompts, and
graph wiring are deliberately left as `TODO` stubs. Every stub file explains
what it should do — the point is to write it, not to read it.

## Status

Phase 1 (single-posting triage), scaffolded. Nothing runs end to end yet: the
nodes throw `not implemented` and `POST /api/triage` returns 501.

## Setup

Requires Node 20.9+ (this repo was scaffolded on v20.13.1) and pnpm.

```bash
pnpm install
```

```bash
cp .env.local.example .env.local
```

Fill in `ANTHROPIC_API_KEY` ([console](https://console.anthropic.com/settings/keys))
and `TAVILY_API_KEY` ([app.tavily.com](https://app.tavily.com)), then:

```bash
pnpm dev
```

The form is at http://localhost:3000.

Note: a stray `package.json` in the parent directory (`~/Documents/GitHub`)
pins `packageManager: yarn`, which makes pnpm refuse to run in subdirectories.
This repo declares `packageManager: pnpm` in its own `package.json` to override
that.

## Architecture

```
[intake] -> [research] -> [score_fit] -> decision -> [draft_letter] -> END
                ^                           |
                +----- loop if thin --------+
```

The loop-back edge is the interesting part: if `score_fit` is uncertain or the
research was thin, control returns to `research` with a different query angle,
capped at `MAX_RESEARCH_ATTEMPTS` regardless of confidence.

## Layout

This follows the first strategy in the Next.js
[project structure docs](https://nextjs.org/docs/app/getting-started/project-structure#store-project-files-outside-of-app):
project files live in root-level folders and `app/` is kept purely for routing.
No `src/` folder, so paths in the docs map here directly. The `@/*` import alias
resolves from the repo root.

A route only becomes public once it has a `page.tsx` or `route.ts`, so
non-routable files could also be colocated inside `app/` — that's just not the
strategy used here.

| Path | What |
| --- | --- |
| `app/layout.tsx` | Root layout. Required, holds `<html>` / `<body>`. |
| `app/page.tsx` | Form + result view at `/`. **Stub.** |
| `app/api/triage/route.ts` | `POST /api/triage`, invokes the graph. **Stub.** |
| `lib/agent/state.ts` | State schema, `JobInput` / `FitScore` types. **Stub.** |
| `lib/agent/graph.ts` | Graph wiring. **Stub** — the main exercise. |
| `lib/agent/nodes/intake.ts` | Resolve URL or text into `jobText`. **Stub.** |
| `lib/agent/nodes/research.ts` | Tavily company research. **Stub.** |
| `lib/agent/nodes/scoreFit.ts` | Fit score + the routing function. **Stub.** |
| `lib/agent/nodes/draftLetter.ts` | Cover letter opener. **Stub.** |
| `lib/agent/tools/search.ts` | Tavily search + extract wrapper. **Stub.** |

Suggested order to build in: `state.ts` (the annotation) -> `tools/search.ts` ->
`intake` -> `graph.ts` as a straight line -> `research` -> `score_fit` ->
the conditional edge -> `draft_letter`.

## Scripts

Per the [installation docs](https://nextjs.org/docs/app/getting-started/installation).

| Command | What |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack is the default bundler in Next 16) |
| `pnpm build` | Production build |
| `pnpm start` | Production server |
| `pnpm lint` | `eslint` |
| `pnpm lint:fix` | `eslint --fix` |
| `pnpm type-check` | `tsc --noEmit` (not from the docs, added to check the stubs compile) |

`next lint` no longer exists — it was removed in Next 16 in favour of calling the
ESLint CLI directly. Config is in `eslint.config.mjs` (flat config, using
`eslint-config-next/core-web-vitals` + `/typescript`).

ESLint is pinned to `^9`. `eslint-config-next`'s transitive plugins
(`eslint-plugin-react`, `-import`, `-jsx-a11y`) don't declare peer support for
ESLint 10 yet.

`pnpm lint` currently reports ~8 `no-unused-vars` warnings. Those are the stub
functions that don't use their `state` parameter yet; they go away as you
implement the nodes.

## Reading the docs

Two things worth knowing:

- `next upgrade` also updates the docs bundled inside the package at
  `node_modules/next/dist/docs/`, so an agent working in this repo reads the
  version you actually have installed rather than its training data.
- `create-next-app` can generate an `AGENTS.md` for the same purpose. This repo
  was set up manually and doesn't have one; add it if you want it.

## Definition of done (Phase 1)

- Paste a posting, get back a fit score with reasoning and a letter draft.
- The conditional loop actually triggers sometimes. A graph that never branches
  is a chain wearing a costume.
- Runs locally with `pnpm dev`.

Phase 2 (scheduled job discovery, dedupe, digest email, `/jobs` page) is
specified in the requirements doc and intentionally not scaffolded yet.
