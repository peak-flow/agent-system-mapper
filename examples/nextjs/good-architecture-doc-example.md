# LinkBoard Architecture Overview

## Metadata
| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/nextjs/linkboard/` |
| Commit | `213c7d4` |
| Documented | `2026-08-03` |
| Verification Status | `Verified` |

Verify with:

```bash
python3 verify.py examples/nextjs/good-architecture-doc-example.md --repo-root examples/nextjs/linkboard
```

## Verification Summary
- `[VERIFIED]`: 71 tags — 63 carrying 85 machine-checkable `path:line` citations (100% resolved), 8 informal (dynamic-segment paths; see the note in "Why This Example is GOOD")
- `[INFERRED]`: 2 claims
- `[NOT_FOUND]`: 10 items (middleware, Pages Router, database, auth, styling, tests, env config, error/loading conventions, lockfile, external services)
- `[ASSUMED]`: 1 item (npm as package manager)
- `[NEEDS_VERIFICATION]`: 1 item (per-platform process model for the in-memory store)

---

## 0. System Classification

| Field | Value |
|-------|-------|
| Category | Traditional Code |
| Type | Full-stack Next.js **App Router** application: server-rendered pages plus co-located JSON API routes in one deployable |
| Evidence | `app/` directory with `layout.jsx`/`page.jsx` files [VERIFIED: app/layout.jsx:8, app/page.jsx:5]; HTTP handlers under `app/api/` [VERIFIED: app/api/links/route.js:7, 11]; `next` dependency [VERIFIED: package.json:11] |
| Overlay Loaded | No |
| Confidence | `[VERIFIED]` |

The dependency block that anchors the classification, quoted:

[VERIFIED: package.json:10-14]
```json
  "dependencies": {
    "next": "~14.2.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
```

**Why "Frontend SPA" would be the wrong classification:** the pages are server components that read data in-process (no client-side data fetching on render) [VERIFIED: app/page.jsx:1-6], and the repo ships its own HTTP API surface under `app/api/` [VERIFIED: app/api/links/route.js:7-9]. A SPA classification would miss the entire backend half of the system.

---

## 1. System Purpose

LinkBoard is a small team link-sharing board. Teammates browse a vote-ranked list of shared links on the board page, open a detail page per link, submit new links through a form, and upvote links. Reads happen server-side directly against an in-memory store; writes go through JSON API routes called from two client components. The store seeds three example links and holds everything in process memory [VERIFIED: lib/store.js:14, 41-43].

---

## 2. Component Map

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| Root layout | `app/layout.jsx` | Wraps every route with header and nav | [VERIFIED: app/layout.jsx:8-19] |
| Board page | `app/page.jsx` | Server component; lists links sorted by votes | [VERIFIED: app/page.jsx:5-6] |
| Link detail page | `app/links/[id]/page.jsx` | Server component for the dynamic `/links/:id` route; 404s on unknown id | [VERIFIED: app/links/[id]/page.jsx:6-10] [VERIFIED: lib/store.js:45-47] |
| Submit page | `app/submit/page.jsx` | Server component shell that renders the client form | [VERIFIED: app/submit/page.jsx:8, 12] |
| SubmitForm | `components/SubmitForm.jsx` | Client component; controlled form that POSTs to the API | [VERIFIED: components/SubmitForm.jsx:1, 16-20] |
| VoteButton | `components/VoteButton.jsx` | Client component; PATCHes a vote, then refreshes | [VERIFIED: components/VoteButton.jsx:1, 14] |
| LinkCard | `components/LinkCard.jsx` | Server component; renders one board row | [VERIFIED: components/LinkCard.jsx:5-6] |
| Collection API route | `app/api/links/route.js` | `GET` list and `POST` create handlers | [VERIFIED: app/api/links/route.js:7, 11] |
| Item API route | `app/api/links/[id]/route.js` | `PATCH` vote handler for one link | [VERIFIED: app/api/links/[id]/route.js:4] [VERIFIED: lib/store.js:63-68] |
| Store | `lib/store.js` | In-memory `Map` with seed data; all reads and writes | [VERIFIED: lib/store.js:14, 41, 49, 63] |

[INFERRED: `LinkCard`, the three pages, and the layout are React **server** components — none of them opens with a `'use client'` directive, and App Router files default to server components. Only `SubmitForm` and `VoteButton` carry the directive.]

---

## 3. Execution Surfaces & High-Level Data Movement (Discovery Only)

Page routes and API routes are distinct execution surfaces: page requests render React server components to HTML, while `/api/*` requests run plain HTTP handlers that return JSON. Detailed tracing of any surface belongs in `02-code-flows.md`.

### 3.1 Primary Execution Surfaces

| Entry Surface | Type | Primary Components Involved | Evidence |
|---------------|------|-----------------------------|----------|
| `GET /` | Page (server-rendered) | BoardPage, `listLinks`, LinkCard, VoteButton | [VERIFIED: app/page.jsx:5-6] |
| `GET /links/:id` | Page (server-rendered, dynamic segment) | LinkDetailPage, `getLink`, VoteButton | [VERIFIED: app/links/[id]/page.jsx:6-7] [VERIFIED: lib/store.js:45-47] |
| `GET /submit` | Page (server-rendered) | SubmitPage, SubmitForm | [VERIFIED: app/submit/page.jsx:8, 12] |
| `GET /api/links` | API (JSON) | `GET` handler, `listLinks` | [VERIFIED: app/api/links/route.js:7-9] |
| `POST /api/links` | API (JSON) | `POST` handler, `createLink` | [VERIFIED: app/api/links/route.js:11, lib/store.js:49] |
| `PATCH /api/links/:id` | API (JSON, dynamic segment) | `PATCH` handler, `voteLink` | [VERIFIED: app/api/links/[id]/route.js:4-5] [VERIFIED: lib/store.js:63-68] |

### 3.2 High-Level Data Movement (Non-Procedural)

| Stage | Input Type | Output Type | Participating Components |
|-------|------------|-------------|--------------------------|
| Page render | HTTP GET for a page path | HTML (server-rendered React tree) | layout, page components, `lib/store.js` reads |
| Link listing | Module state (`Map`) | Vote-sorted array of link objects | `listLinks` [VERIFIED: lib/store.js:41-43] |
| Link creation | JSON body (`title`, `url`, `tag`) | 201 JSON link object, or 400 JSON error | `POST` handler, `createLink` [VERIFIED: app/api/links/route.js:11-30] |
| Vote increment | URL id segment | JSON link object with incremented `votes`, or 404 | `PATCH` handler, `voteLink` [VERIFIED: lib/store.js:63-68] |
| Client refresh | Completed mutation | Re-rendered server components | `router.refresh()` [VERIFIED: components/VoteButton.jsx:16, components/SubmitForm.jsx:27] |

### 3.3 Pointers to Code Flow Documentation

Candidates for detailed flow tracing (see `02-code-flows.md`):

- **Submit-a-link flow** — SubmitForm POST through validation to store insert and redirect
- **Vote flow** — VoteButton PATCH through the dynamic API route to `voteLink` and refresh
- **Board render** — server-side read path from request to sorted HTML list

### Section 3 Self-Check
- [x] No method bodies longer than 3 lines quoted in this section
- [x] No loops or conditionals explained
- [x] All movements described as conceptual stages, not steps
- [x] Detailed tracing deferred to `02-code-flows.md`

---

## 3b. Frontend → Backend Interaction Map

Every client-initiated backend call in the system, one row per distinct interaction. Both sides are cited: the frontend trigger and the backend handler.

| Frontend Source | Trigger Type | Backend Target | Handler / Method | Evidence |
|-----------------|--------------|----------------|------------------|----------|
| `components/SubmitForm.jsx` | fetch (POST, form submit) | `app/api/links/route.js` | `POST` | [VERIFIED: components/SubmitForm.jsx:16-20] [VERIFIED: app/api/links/route.js:11] |
| `components/VoteButton.jsx` | fetch (PATCH, button click) | `app/api/links/[id]/route.js` | `PATCH` | [VERIFIED: components/VoteButton.jsx:14] [VERIFIED: app/api/links/[id]/route.js:4] |

The client sides of both rows are quoted below; the fetch targets are relative paths, so both calls are same-origin.

[VERIFIED: components/SubmitForm.jsx:16-20]
```jsx
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url, tag }),
    })
```

[VERIFIED: components/VoteButton.jsx:14]
```jsx
    await fetch(`/api/links/${id}`, { method: 'PATCH' })
```

[INFERRED: these are the only frontend-to-backend interactions — `fetch(` appears nowhere else in the repo, and no form uses a native `action=` attribute.]

---

## 4. File/Folder Conventions

App Router conventions in use — the file's **name and location** determine its role:

| Pattern | Meaning | Evidence |
|---------|---------|----------|
| `app/layout.jsx` | Root layout; wraps every route's page in shared HTML | [VERIFIED: app/layout.jsx:8-19] |
| `app/**/page.jsx` | Routable page at the folder's URL path (`/`, `/links/:id`, `/submit`) | [VERIFIED: app/page.jsx:5, app/submit/page.jsx:8] |
| `app/api/**/route.js` | HTTP endpoint; exports functions named after HTTP verbs (`GET`, `POST`, `PATCH`) | [VERIFIED: app/api/links/route.js:7, 11] |
| `[id]` folder name | Dynamic URL segment, delivered to the handler via `params` | [VERIFIED: app/links/[id]/page.jsx:6-7] |
| `components/` | Shared React components (mixed server and client) | [VERIFIED: components/LinkCard.jsx:5, components/VoteButton.jsx:6] |
| `lib/` | Non-React server-side modules (the store) | [VERIFIED: lib/store.js:41-68] |

**Server-vs-client component split.** Exactly two files opt into the client runtime with the `'use client'` directive as their first line [VERIFIED: components/SubmitForm.jsx:1, components/VoteButton.jsx:1]. One of the two directives, quoted:

[VERIFIED: components/VoteButton.jsx:1]
```jsx
'use client'
```

Everything else under `app/` and `components/` has no directive and therefore runs as server components. The board page demonstrates the payoff — it imports the store and reads it in-process, with no HTTP hop:

[VERIFIED: app/page.jsx:1-6]
```jsx
import { listLinks } from '../lib/store'
import LinkCard from '../components/LinkCard'

// Server component: reads the store directly, no fetch involved.
export default function BoardPage() {
  const links = listLinks()
```

[NOT_FOUND: no loading.jsx, error.jsx, or not-found.jsx files anywhere under app/ — searched for all three names. The app defines no custom loading, error, or 404 UI; `notFound()` in the detail page falls through to the framework default.]

---

## 5. External Dependencies

| Dependency | Purpose | Evidence |
|------------|---------|----------|
| `next` `~14.2.3` | Framework: routing, server components, API routes | [VERIFIED: package.json:11] |
| `react` / `react-dom` `^18.2.0` | Component runtime | [VERIFIED: package.json:12-13] |
| `next/link` | Client-side navigation in layout and cards | [VERIFIED: app/layout.jsx:1, components/LinkCard.jsx:1] |
| `next/navigation` | `useRouter` in client components; `notFound` in the detail page | [VERIFIED: components/SubmitForm.jsx:4, components/VoteButton.jsx:4, app/links/[id]/page.jsx:1] |
| `next/server` | `NextResponse` JSON helpers in API routes | [VERIFIED: app/api/links/route.js:1, app/api/links/[id]/route.js:1] |

[NOT_FOUND: no database and no ORM — searched "prisma", "postgres", "mysql", "sqlite", "mongo", "drizzle", zero matches. The only persistence is the in-memory Map in lib/store.js.]

[NOT_FOUND: no external services — every `fetch(` call in the repo targets a relative `/api/...` path; no third-party host, SDK, webhook, or analytics call exists.]

[NOT_FOUND: no environment configuration — searched "process.env" across the repo, zero matches; no `.env*` files are present (the `.gitignore` merely excludes them).]

[NOT_FOUND: no lockfile — package-lock.json, yarn.lock, and pnpm-lock.yaml are all absent.] [ASSUMED: npm is the package manager, based on convention only — nothing in the repo pins one.]

---

## 6. Known Issues & Risks

### 6.1 In-memory store loses data and breaks on serverless

[VERIFIED: lib/store.js:1-7]
```js
/**
 * In-memory link store shared by server components and API routes.
 *
 * Wart: Module-level Map — every server restart wipes the data, and the
 * store is NOT shared across serverless instances. Two lambdas each get
 * their own copy, so votes and submissions silently diverge in production.
 */
```

All submissions and votes live in a module-level `Map` [VERIFIED: lib/store.js:14]. A restart resets to the three seed links, and on multi-instance or serverless deployments each instance holds an independent copy. [NEEDS_VERIFICATION: how quickly instances diverge in practice depends on the deployment platform's process model — cannot be confirmed from source.]

### 6.2 POST handler skips validation on `tag`

`title` and `url` are validated, but `tag` is stored untouched:

[VERIFIED: app/api/links/route.js:26-29]
```js
  // Wart: tag is passed straight through with no validation — whatever
  // value (or type) the client sends lands in the store as-is.
  const link = createLink({ title: body.title, url: body.url, tag: body.tag })
  return NextResponse.json(link, { status: 201 })
```

### 6.3 `MAX_TITLE_LENGTH` duplicated in two files

[VERIFIED: lib/store.js:9-10]
```js
// Wart: duplicated in app/api/links/route.js instead of being imported there.
export const MAX_TITLE_LENGTH = 80
```

[VERIFIED: app/api/links/route.js:4-5]
```js
// Wart: duplicated from lib/store.js — the two copies can silently drift.
const MAX_TITLE_LENGTH = 80
```

The store exports the constant, but the API route re-declares it instead of importing. If one copy changes, validation (route) and truncation (store) disagree silently.

### 6.4 VoteButton has no error handling on its fetch

[VERIFIED: components/VoteButton.jsx:10-17]
```jsx
  // Wart: no error handling — a failed PATCH is silently swallowed and
  // the on-screen count goes stale with no feedback to the user.
  async function vote() {
    setPending(true)
    await fetch(`/api/links/${id}`, { method: 'PATCH' })
    setPending(false)
    router.refresh()
  }
```

No `.ok` check, no `try/catch` — contrast with SubmitForm, which surfaces API errors to the user [VERIFIED: components/SubmitForm.jsx:21-25].

---

## 7. Entry Points Summary

| Route/Entry | Method | Handler | Middleware | Verified |
|-------------|--------|---------|------------|----------|
| `/` | GET | `BoardPage` in `app/page.jsx` | none | [VERIFIED: app/page.jsx:5] |
| `/links/:id` | GET | `LinkDetailPage` in `app/links/[id]/page.jsx` | none | [VERIFIED: app/links/[id]/page.jsx:6] [VERIFIED: lib/store.js:45] |
| `/submit` | GET | `SubmitPage` in `app/submit/page.jsx` | none | [VERIFIED: app/submit/page.jsx:8] |
| `/api/links` | GET | `GET` in `app/api/links/route.js` | none | [VERIFIED: app/api/links/route.js:7] |
| `/api/links` | POST | `POST` in `app/api/links/route.js` | none | [VERIFIED: app/api/links/route.js:11] |
| `/api/links/:id` | PATCH | `PATCH` in `app/api/links/[id]/route.js` | none | [VERIFIED: app/api/links/[id]/route.js:4] [VERIFIED: lib/store.js:63] |

[NOT_FOUND: no middleware.js or middleware.ts anywhere in the repo — searched "middleware", zero matches. The "Middleware: none" column above is a verified absence, not an omission.]

[NOT_FOUND: no pages/ directory and no Pages Router data hooks — searched "getServerSideProps", "getStaticProps", "getInitialProps", zero matches. Routing is App Router only; there is no `pages/api/` either.]

[NOT_FOUND: no authentication — searched "auth", "session", "jwt", "cookie", "next-auth", zero matches. Every page and API route is open.]

---

## 8. Technology Stack

| Layer | Technology | Evidence |
|-------|------------|----------|
| Framework | Next.js `~14.2.3`, App Router | [VERIFIED: package.json:11, app/layout.jsx:8] |
| UI runtime | React 18 (server components by default, two client components) | [VERIFIED: package.json:12, components/SubmitForm.jsx:1] |
| API layer | Route handlers under `app/api/` returning `NextResponse.json` | [VERIFIED: app/api/links/route.js:1, 8] |
| Persistence | In-memory `Map` in `lib/store.js` (no database) | [VERIFIED: lib/store.js:14] |
| Build config | `next.config.mjs` with `reactStrictMode` only | [VERIFIED: next.config.mjs:2-4] |
| Styling | None | [NOT_FOUND: no .css files and no styling framework — searched "*.css", "tailwind", "styled", zero matches; `className` attributes exist but nothing styles them] |
| Tests | None | [NOT_FOUND: no *.test.* or *.spec.* files, no jest/vitest config anywhere in the repo] |

---

## Why This Example is GOOD

1. **Correct system classification.** It resists the reflex to call anything with React a "Frontend SPA". The evidence (server components reading a store in-process, plus an `app/api/` HTTP surface) drives the classification to full-stack App Router app.
2. **Page routes and API routes are documented as distinct surfaces.** Section 3.1 separates server-rendered page entries from JSON API entries instead of flattening them into one "routes" list.
3. **Every claim is cited or admitted.** Positive claims carry `[VERIFIED: path:line]` citations that the verifier resolves against the real tree; absences are explicit `[NOT_FOUND: ...]` entries that name the searches performed.
4. **The frontend-to-backend map cites both sides.** Each row in section 3b points at the client `fetch` call *and* the handler that receives it — a reader can open both files and see the contract.
5. **Honest negatives for things people assume Next.js apps have.** No middleware, no Pages Router (`getServerSideProps` / `pages/api` do not exist here), no database behind the store, no auth, no lockfile — each recorded as a `[NOT_FOUND]` with the search that proved it.
6. **Quotes are exact.** Every fenced block after a citation is a copy-paste of the cited lines, so the verifier's quote-matching phase passes; nothing is paraphrased into fiction.
7. **No invented execution narratives.** Data movement is expressed as tables of stages, not step-by-step arrow traces; detailed tracing is deferred to `02-code-flows.md`.
8. **Known limitation, stated instead of hidden:** citations into the two dynamic-segment files (paths containing `[id]`) cannot be machine-parsed, because the verifier's tag grammar ends a tag at the first `]`. Those citations appear in full for human readers but count as "informal" in the verifier report; every claim about those files is therefore paired with a machine-checkable citation into a caller or into `lib/store.js`.
