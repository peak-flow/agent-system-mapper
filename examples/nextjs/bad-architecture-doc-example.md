# LinkBoard Architecture Overview

> ⚠️ **BAD EXAMPLE — DO NOT IMITATE.** This document demonstrates hallucination patterns — for Next.js, above all App-Router/Pages-Router conflation. Each ❌ callout explains a failure. See good-architecture-doc-example.md for the correct approach.

## What This App Does

LinkBoard is a production-grade, real-time link-sharing platform for distributed teams. Members authenticate with their workspace account, share links, vote in real time, and receive notifications when their submissions trend. The platform is built on Next.js with a PostgreSQL database and scales horizontally across regions.

> **❌ PROBLEMS:** Inflated purpose with zero citations. There is no authentication, no real-time anything, no notifications, and no database — the whole data layer is one in-memory `Map` seeded with three links (`lib/store.js:14`). "Scales horizontally" is the opposite of the truth: the store's own header comment warns that instances silently diverge (`lib/store.js:4-6`). The good doc states what the app is in one cited paragraph.

## Technology Stack

- Next.js 14 using the Pages Router for maximum stability
- React 18 with SWR for client-side data fetching
- Prisma ORM over PostgreSQL
- NextAuth.js for session management
- TailwindCSS for styling

> **❌ PROBLEMS:** Four of five bullets are invented. The repo uses the **App Router** — there is no `pages/` directory at all; routing lives in `app/` (`app/page.jsx:5`, `app/layout.jsx:8`). `package.json` lists exactly three dependencies: `next`, `react`, `react-dom` (`package.json:10-14`) — no SWR, no Prisma, no NextAuth, no Tailwind. Data fetching on pages is not client-side at all: the board page is a server component that calls the store in-process (`app/page.jsx:1-6`). This is the classic Pages-Router conflation: the author documented the Next.js they remember, not the Next.js in the repo.

## Routing & Data Fetching

Routes are defined as files under `pages/`. The home page at `pages/index.js` fetches the link list in `getServerSideProps`, which runs on every request and passes props to the page component. The detail page at `pages/links/[id].js` uses `getServerSideProps` with `context.params.id`, and `pages/submit.js` renders the submission form. Static marketing pages use `getStaticProps` with incremental static regeneration.

> **❌ PROBLEMS:** Every path in this section is fabricated. There is no `pages/` directory and the strings `getServerSideProps`, `getStaticProps`, and `getInitialProps` appear nowhere in the repo. The real routes are App Router files: `app/page.jsx` (board, `app/page.jsx:5`), `app/links/[id]/page.jsx` (detail, line 6), and `app/submit/page.jsx` (submit, line 8). Server components make `getServerSideProps` unnecessary — the page function itself runs on the server and reads the store directly (`app/page.jsx:6`). Citing files that do not exist is the single fastest way to destroy a reader's trust.

## API Layer

The API lives in `pages/api/links.js`, which exports a default handler that switches on `req.method` to implement GET, POST, PUT, and DELETE. Voting is handled by `pages/api/links/[id]/vote.js`. All handlers use the shared `withAuth` wrapper to reject unauthenticated requests before touching the database.

> **❌ PROBLEMS:** Wrong router, wrong file shape, wrong handler signature, invented wrapper. The real API routes are App Router **route handlers**: `app/api/links/route.js` exports named `GET` and `POST` functions (`app/api/links/route.js:7`, `app/api/links/route.js:11`) — there is no default export and no `req.method` switch. The vote endpoint is `PATCH` in `app/api/links/[id]/route.js:4`, not a `vote.js` file, and no PUT or DELETE exists anywhere. `withAuth` is pure invention — the handlers call the store and return `NextResponse.json` with nothing in between (`app/api/links/[id]/route.js:5-9`).

## Authentication & Middleware

`middleware.js` at the project root intercepts every request, validates the NextAuth JWT from the session cookie, and redirects unauthenticated users to `/login`. The `/submit` page and all mutating API routes are protected; the board is public. Role claims in the token distinguish admins, who may delete links, from members.

> **❌ PROBLEMS:** This entire section describes a file that does not exist. There is no `middleware.js` or `middleware.ts` anywhere in the repo, no login page, no cookie handling, no JWT, no roles, and no delete capability. Every page and API route is open — the POST handler validates `title` and `url` but never asks who is calling (`app/api/links/route.js:11-25`). An honest doc records this as a verified absence, the way the good doc's Entry Points section does with its middleware `[NOT_FOUND]` entry. Inventing a security layer is the most dangerous hallucination in this document: a reader could ship the app believing it is protected.

## Data Layer

`lib/store.js` is a thin repository wrapper around Prisma. It opens a pooled PostgreSQL connection, and each helper (`listLinks`, `getLink`, `createLink`, `voteLink`) delegates to `prisma.link` queries. Votes use an atomic `increment` update to stay consistent under concurrent load.

> **❌ PROBLEMS:** The function names are real — the author clearly skimmed the exports (`lib/store.js:41`, `lib/store.js:45`, `lib/store.js:49`, `lib/store.js:63`) — but everything about their implementation is fiction. `lib/store.js` contains a module-level `new Map(...)` with three hard-coded seed links (`lib/store.js:14-39`); the words Prisma, PostgreSQL, and pool appear nowhere in the repo. Far from "consistent under concurrent load", the store's own comment warns that data is wiped on restart and diverges across serverless instances (`lib/store.js:4-6`). Wrapping real symbol names around an imagined implementation is exactly the failure mode citation-plus-quote verification exists to catch.

## Hydration & Data Flow

1. Browser requests `/` and receives the server-rendered HTML shell
2. Next.js sends the JavaScript bundle for the whole page
3. React hydrates every component on the page, attaching event listeners
4. SWR takes over data fetching and revalidates the link list every 30 seconds
5. When the user votes, the mutation is sent and SWR optimistically updates the cache
6. The reconciled list re-renders with fresh vote counts

> **❌ PROBLEMS:** Two failures at once. First, the content is wrong: in the App Router only the two `'use client'` components are hydrated — `SubmitForm` (`components/SubmitForm.jsx:1`) and `VoteButton` (`components/VoteButton.jsx:1`); server components ship as rendered output, not as hydratable bundle code. There is no SWR, no polling, no revalidation interval, and no optimistic cache — voting is a bare `fetch` PATCH followed by `router.refresh()` (`components/VoteButton.jsx:14-16`). Second, the format is wrong: a numbered step-by-step trace of runtime behavior does not belong in an architecture overview at all — the methodology defers execution tracing to `02-code-flows.md`, and nothing here could be verified by reading source anyway.

## Database Schema

| Table | Columns |
|-------|---------|
| users | id, email, password_hash, workspace_id |
| links | id, title, url, tag, votes, user_id, created_at |
| votes | id, link_id, user_id, created_at |

> **❌ PROBLEMS:** There is no database, so there is no schema. No `users` table (no users exist at all), no `votes` table (votes are a plain integer field incremented in place, `lib/store.js:66`), no `user_id` anywhere. The real record shape is the object literal in the seed data: `id`, `title`, `url`, `tag`, `votes`, `createdAt` (`lib/store.js:15-22`) — note the doc even gets the casing wrong (`created_at` vs `createdAt`). A schema table with made-up tables reads as authoritative and is pure fiction.

## Why This Example is BAD

1. **Claims the Pages Router in an App Router repo.** `pages/index.js`, `getServerSideProps`, `pages/api/links.js` — none exist; routing is `app/page.jsx:5`, `app/links/[id]/page.jsx:6`, `app/submit/page.jsx:8`, and the API is named `GET`/`POST` exports in `app/api/links/route.js:7` and `app/api/links/route.js:11`. This conflation is *the* signature Next.js hallucination.
2. **Invents middleware-based authentication.** No `middleware.js`, no NextAuth, no `withAuth`, no login route exists; every surface is open (`app/api/links/route.js:11-25` checks fields, never identity). A fabricated security layer can cause real-world harm.
3. **Claims Prisma/PostgreSQL behind `lib/store.js`.** The file is an in-memory `Map` with seed data (`lib/store.js:14-39`) whose own comment documents data loss on restart (`lib/store.js:4-6`).
4. **Describes a hydration flow step by step.** Wrong content (only `components/SubmitForm.jsx:1` and `components/VoteButton.jsx:1` are client components; no SWR — voting is `fetch` plus `router.refresh()`, `components/VoteButton.jsx:14-16`) and wrong genre — execution traces belong in `02-code-flows.md`, not an architecture overview.
5. **Presents an invented database schema.** No `users` or `votes` tables; the real shape is the seed object literal (`lib/store.js:15-22`), including `createdAt`, not `created_at`.
6. **Zero citations and zero verification tags.** Nothing is marked `[VERIFIED]`, `[INFERRED]`, or `[NOT_FOUND]`, so a reader cannot distinguish the real function names (there are a few) from the fiction wrapped around them — and `verify.py` has nothing to check. Unverifiable confidence is worse than admitted uncertainty.
