# Vue Kanban Board Architecture Overview

> This is the GOOD architecture-overview example for Vue SPAs in the
> agent-system-mapper methodology. Every citation resolves against the mini app
> bundled at `examples/vue/kanban-board/`, so this document is self-verifiable
> from the repo root with the command shown below.

## Metadata

| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/vue/kanban-board/` |
| Commit | `9a69c14` |
| Documented | `2026-08-03` |
| Verification Status | `Verified` |

Verify with:

```bash
python3 verify.py examples/vue/good-architecture-doc-example.md --repo-root examples/vue/kanban-board
```

## Verification Summary

- `[VERIFIED]`: 80 tags — 102 file:line citations, 102 resolving (100%); 1 informal (structural evidence, no file:line)
- `[INFERRED]`: 1 claim
- `[NOT_FOUND]`: 7 items
- `[ASSUMED]`: 1 item
- `[NEEDS_VERIFICATION]`: 1 item
- Quoted blocks: 6/6 match the cited source exactly (phase-2 similarity 1.00)

---

## 0. System Classification

| Field | Value |
|-------|-------|
| Category | Traditional Code |
| Type | Frontend SPA (Vue 3 + Vite, no server routes) |
| Evidence | `vue` and `pinia` declared as dependencies [VERIFIED: package.json:12-13]; single-file components under `src/components/` [VERIFIED: src/components/KanbanBoard.vue:1] [NOT_FOUND: no server directory, no HTTP framework, no fetch/axios/XHR anywhere in src/] |
| Overlay Loaded | No |
| Confidence | `[VERIFIED]` |

---

## 1. System Purpose

A single-page Kanban board for organizing cards across three columns, aimed at a single local user. All state lives in the browser: Pinia stores hold reactive columns and cards, every mutation is written to localStorage, and a mock "sync" layer simulates — but never performs — server communication. The board store's own architecture note states that it "manages LOCAL state" and that changes "are NOT automatically persisted to server" [VERIFIED: src/stores/boardStore.js:9-15], and the API service's note confirms "No actual server exists" [VERIFIED: src/services/api.js:5-6].

[INFERRED: the deliberate `// Wart:` comments throughout the codebase — mock server state, unsynced deletes, silent persistence failures — indicate this app is a teaching fixture for documenting flawed sync architectures rather than a production tool; the warts are labeled by the authors themselves in the files cited in section 6]

---

## 2. Component Map

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| Bootstrap | `src/main.js` | Creates the Vue app, installs Pinia, mounts `#app` | [VERIFIED: src/main.js:6-10] |
| App shell | `src/App.vue` | Renders header + board; loads persisted state and registers online/offline listeners on mount | [VERIFIED: src/App.vue:11-23] |
| Board container | `src/components/KanbanBoard.vue` | Renders one `KanbanColumn` per store column | [VERIFIED: src/components/KanbanBoard.vue:10-14] |
| Column | `src/components/KanbanColumn.vue` | Per-column card list, drop target, add-card form | [VERIFIED: src/components/KanbanColumn.vue:46-48, 65-78] |
| Card | `src/components/KanbanCard.vue` | Draggable card with sync indicator and delete button | [VERIFIED: src/components/KanbanCard.vue:34-36, 42-61] |
| Sync status bar | `src/components/SyncStatus.vue` | Shows offline/syncing/pending/synced, "Sync Now" button, error indicator | [VERIFIED: src/components/SyncStatus.vue:12-40] |
| Board store | `src/stores/boardStore.js` | Pinia store: columns + cards state and all card mutations | [VERIFIED: src/stores/boardStore.js:17-21] |
| Sync store | `src/stores/syncStore.js` | Pinia store: online state, pending queue, sync trigger | [VERIFIED: src/stores/syncStore.js:17-23] |
| API service | `src/services/api.js` | Mock server boundary — in-memory "server state" only | [VERIFIED: src/services/api.js:17-23] |
| Persistence service | `src/services/persistence.js` | localStorage save/load/clear under one storage key | [VERIFIED: src/services/persistence.js:12-24] |
| Drag-and-drop composable | `src/composables/useDragDrop.js` | Drag state refs and DOM drag event handlers | [VERIFIED: src/composables/useDragDrop.js:12-17] |
| Type docs | `src/types/index.js` | JSDoc typedefs + `SYNC_STATUS` constants (documentation only) | [VERIFIED: src/types/index.js:8-17, 42-46] |

---

## 3. Execution Surfaces & High-Level Data Movement (Discovery Only)

This section records where execution enters the app and what data moves at a
high level. Step-by-step execution tracing is deliberately deferred to the
code-flow documentation (see section 3.3).

### 3.1 Primary Execution Surfaces

| Entry Surface | Type | Primary Components Involved | Evidence |
|--------------|------|-----------------------------|----------|
| Browser page load | Web | `index.html` loads `/src/main.js`; app mounts at `#app` | [VERIFIED: index.html:10, src/main.js:6-10] |
| App mount hook | Lifecycle event | `App.vue` `onMounted` → `boardStore.loadFromLocal()` | [VERIFIED: src/App.vue:11-13] |
| `window` online/offline events | Browser event | `App.vue` listeners → `syncStore` | [VERIFIED: src/App.vue:16-22] |
| Add-card form | UI event | `KanbanColumn.vue` → `boardStore.addCard` | [VERIFIED: src/components/KanbanColumn.vue:33-39] |
| Card drag/drop | UI event | `KanbanCard.vue`, `KanbanColumn.vue`, `useDragDrop`, `boardStore.moveCard` | [VERIFIED: src/components/KanbanCard.vue:34-36, src/components/KanbanColumn.vue:46-48] |
| Card delete button | UI event | `KanbanCard.vue` → `boardStore.deleteCard` | [VERIFIED: src/components/KanbanCard.vue:58] |
| "Sync Now" button | UI event | `SyncStatus.vue` → `syncStore.triggerSync` → mock API | [VERIFIED: src/components/SyncStatus.vue:28-34] |
| `npm run dev` / `build` / `preview` | CLI (Vite) | Vite + `@vitejs/plugin-vue` | [VERIFIED: package.json:6-10, vite.config.js:4-6] |

### 3.2 High-Level Data Movement (Non-Procedural)

| Stage | Input Type | Output Type | Participating Components |
|------|------------|-------------|--------------------------|
| Bootstrap load | localStorage JSON (or nothing) | Reactive store state (columns, cards) | `persistence.load`, `boardStore.loadFromLocal` |
| Card mutation | User input (title, drag position, delete click) | Updated store state + localStorage write | `boardStore` actions, `persistence.save` |
| Sync queueing | Card ID | Pending-queue entry + `pending` card status | `boardStore.markPendingSync`, `syncStore.addToPendingQueue` |
| Sync execution | Queued card objects | In-memory mock "server" records + `synced` card status | `syncStore.triggerSync`, `api.syncCard`, `boardStore.markSynced` |
| Status display | Store state | UI indicators (status text, per-card markers) | `SyncStatus.vue`, `KanbanCard.vue` |

### 3.3 Pointers to Code Flow Documentation

Candidates for detailed flow tracing (see `02-code-flows.md`); no step-by-step
tracing is done in this document:

- **Add Card flow** — add-card form through `boardStore.addCard` to persistence and the sync queue
- **Manual Sync flow** — "Sync Now" through `syncStore.triggerSync` to the mock API and back to card status
- **Move Card (drag-and-drop) flow** — drop handling through `useDragDrop` to `boardStore.moveCard`
- **Delete Card flow** — delete click through `boardStore.deleteCard`, including why deletes never reach the sync queue
- **Reconnect auto-sync flow** — the `isOnline` watcher through delayed `triggerSync`

### Section 3 Self-Check

- [x] No method bodies longer than 3 lines quoted
- [x] No loops or conditionals explained
- [x] Movements described as conceptual stages, not steps
- [x] Detailed tracing deferred to `02-code-flows.md`

---

## 3b. Frontend → Backend Interaction Map

There is no real backend. The "backend boundary" is the in-memory mock in `src/services/api.js` [VERIFIED: src/services/api.js:5-6]. Each row below is a potential flow to trace in the code-flow documentation; internal logic is not described here.

| Frontend Source | Trigger Type | Backend Target | Handler / Method | Evidence |
|-----------------|--------------|----------------|------------------|----------|
| `SyncStatus.vue` ("Sync Now") | click event | `syncStore` → mock API | `triggerSync()` → `api.syncCard()` | [VERIFIED: src/components/SyncStatus.vue:28-34, src/stores/syncStore.js:71] |
| `App.vue` | browser `online` event | `syncStore` | `setOnline(true)` then `triggerSync()` | [VERIFIED: src/App.vue:16-19] |
| `App.vue` | browser `offline` event | `syncStore` | `setOnline(false)` | [VERIFIED: src/App.vue:20-22] |
| `syncStore` | reactive watch on `isOnline` | mock API | delayed `triggerSync()` | [VERIFIED: src/stores/syncStore.js:103-108] |

[NOT_FOUND: searched "fetch(", "axios", "XMLHttpRequest", "WebSocket" in src/ — no real network calls exist; every interaction above terminates in the in-memory mock]

---

## 4. File/Folder Conventions

| Pattern | Meaning | Evidence |
|---------|---------|----------|
| `src/components/*.vue` | Single-file UI components (4 files, `<script setup>`) | [VERIFIED: src/components/KanbanBoard.vue:1, src/components/SyncStatus.vue:1] |
| `src/stores/*.js` | Pinia setup stores via `defineStore` | [VERIFIED: src/stores/boardStore.js:17, src/stores/syncStore.js:17] |
| `src/services/*.js` | Side-effect boundaries: mock API and localStorage persistence | [VERIFIED: src/services/api.js:23, src/services/persistence.js:14] |
| `src/composables/use*.js` | Reusable composition functions | [VERIFIED: src/composables/useDragDrop.js:12] |
| `src/types/` | JSDoc-only type documentation, no runtime validation | [VERIFIED: src/types/index.js:1-6] |
| `// Wart:` comments | The authors' own markers for known gaps | [VERIFIED: src/services/api.js:17, src/stores/boardStore.js:90] |
| `src/utils/`, `public/` | Present but empty | [VERIFIED: directory listing — both directories contain no files] |

---

## 5. External Dependencies

| Dependency | Declared Version | Purpose | Evidence |
|------------|------------------|---------|----------|
| `vue` | `^3.4.0` | UI framework | [VERIFIED: package.json:12] |
| `pinia` | `^2.1.0` | State management | [VERIFIED: package.json:13] |
| `vue-router` | `^4.2.0` | Declared but never used (see section 6, issue 13) | [VERIFIED: package.json:14] |
| `vite` | `^5.0.0` | Dev server / bundler (dev dependency) | [VERIFIED: package.json:18] |
| `@vitejs/plugin-vue` | `^4.5.0` | SFC compilation for Vite (dev dependency) | [VERIFIED: package.json:17] |

Browser platform APIs used directly:

| API | Purpose | Evidence |
|-----|---------|----------|
| `localStorage` | Board persistence | [VERIFIED: src/services/persistence.js:24, 38] |
| `navigator.onLine` | Initial online state | [VERIFIED: src/stores/syncStore.js:19] |
| `window` online/offline events | Connectivity transitions | [VERIFIED: src/App.vue:16-22] |
| HTML5 drag-and-drop (`dataTransfer`) | Card dragging | [VERIFIED: src/composables/useDragDrop.js:21-22] |

[NOT_FOUND: no external services — no HTTP client, no analytics, no auth; searched "fetch(", "axios", "XMLHttpRequest", "http" in src/]

[NOT_FOUND: no lockfile (package-lock.json, yarn.lock, or pnpm-lock.yaml) — declared versions are ranges, so installed versions are not pinned; this document therefore quotes the declared ranges rather than exact versions]

[ASSUMED: Vite convention — `npm run dev` serves index.html with HMR on Vite's default port; vite.config.js adds only the Vue plugin and overrides no defaults]

---

## 6. Known Issues & Risks

All issues below were found while reading the code; several are labeled by the
authors themselves with `// Wart:` comments.

| # | Issue | Risk | Evidence |
|---|-------|------|----------|
| 1 | "Server" is an in-memory variable that resets on page refresh — sync never persists anything | Users see `synced` for data that exists only in RAM | [VERIFIED: src/services/api.js:17-21, src/services/api.js:11] |
| 2 | Deletes are never queued for sync, and the mock delete endpoint just throws | "Ghost cards" if a delete happens offline | [VERIFIED: src/stores/boardStore.js:123-124, src/services/api.js:66-68] |
| 3 | No conflict resolution — sync blindly overwrites "server" state; the sync store's own note lists the gaps | Newer server-side data (if a real server existed) would be clobbered | [VERIFIED: src/services/api.js:41, src/stores/syncStore.js:12-15] |
| 4 | No retry/backoff — on the first sync error the loop logs, records the error, and stops | Pending cards silently stay pending | [VERIFIED: src/stores/syncStore.js:76-81] |
| 5 | localStorage save failures are swallowed (console.error only, no user feedback) | Data loss on quota exceeded with no visible signal | [VERIFIED: src/services/persistence.js:26-30] |
| 6 | localStorage parse errors return `null`, discarding all stored data | Total board loss on corrupted storage | [VERIFIED: src/services/persistence.js:43-47] |
| 7 | Board-store watcher only logs — it looks like change tracking but triggers no sync | Misleading "reactive sync" appearance | [VERIFIED: src/stores/boardStore.js:165-174] |
| 8 | Reconnect watcher auto-syncs after 1s without any conflict check against server state | Offline edits can overwrite concurrent changes | [VERIFIED: src/stores/syncStore.js:101-108] |
| 9 | Card delete has no confirmation dialog | Accidental irreversible deletes | [VERIFIED: src/components/KanbanCard.vue:23-26] |
| 10 | Sync errors surface only as a glyph — no details, no retry affordance | Users cannot act on failures | [VERIFIED: src/components/SyncStatus.vue:36-39] |
| 11 | Drop position is simplified and falls back to index 999 ("end of list") | Cards may land at unexpected positions | [VERIFIED: src/composables/useDragDrop.js:70-77] |
| 12 | Mock API simulates a 10% random failure on every sync call | Intermittent sync errors by design | [VERIFIED: src/services/api.js:36-39] |
| 13 | `vue-router` is declared but never imported or registered | Dead dependency; misleads readers about navigation | [VERIFIED: package.json:14] [NOT_FOUND: searched "createRouter", "RouterView", "router" in src/ — no usage] |
| 14 | IndexedDB is mentioned in requirements but exists only as a commented-out stub | Storage limited to localStorage quotas | [VERIFIED: src/services/persistence.js:75-76] |
| 15 | Drop is treated as complete immediately, with no rollback if a later sync fails | Board can diverge permanently from any real server | [VERIFIED: src/composables/useDragDrop.js:60-62] |

[NEEDS_VERIFICATION] Runtime-only behaviors — the 10% simulated failure rate (issue 12) and the 1-second reconnect delay (issue 8) — require running the app to observe; the citations above verify the code, not the observed timing.

### Evidence excerpts (exact quotes)

The most consequential findings above, quoted verbatim so the verifier's
phase 2 can match each block against the cited source slice.

The mock "server" is a module-level variable [VERIFIED: src/services/api.js:17-21]:

```javascript
// Wart: "Server state" is just in-memory, resets on refresh
let serverState = {
  cards: {},
  lastModified: null,
}
```

Delete sync is explicitly unimplemented [VERIFIED: src/services/api.js:66-68]:

```javascript
  async deleteCard(cardId) {
    throw new Error('Delete sync not implemented')
  },
```

Save failures are silent [VERIFIED: src/services/persistence.js:26-30]:

```javascript
    } catch (error) {
      // Wart: Silently fails on quota exceeded
      console.error('Failed to save to localStorage:', error)
      return false
    }
```

The board-store watcher that looks like sync tracking but is not [VERIFIED: src/stores/boardStore.js:167-174]:

```javascript
  watch(
    () => Object.keys(cards.value).length,
    (newCount, oldCount) => {
      console.log(`Card count changed: ${oldCount} → ${newCount}`)
      // This log makes it LOOK like we're tracking changes
      // but no actual sync happens here
    }
  )
```

Reconnect auto-sync with no conflict check [VERIFIED: src/stores/syncStore.js:103-108]:

```javascript
  watch(isOnline, (online) => {
    if (online && pendingQueue.value.length > 0) {
      // Delay to avoid immediate sync on flaky connections
      setTimeout(() => triggerSync(), 1000)
    }
  })
```

Drop is treated as done without an optimistic-UI rollback path [VERIFIED: src/composables/useDragDrop.js:60-62]:

```javascript
    // Wart: Immediate mutation without optimistic UI pattern
    // This treats the drag as already "done" but it's not synced
    boardStore.moveCard(cardId, fromColumnId, toColumnId, index)
```

---

## 7. Entry Points Summary

| Entry | Type | Handler | Evidence |
|-------|------|---------|----------|
| Page load (`index.html` module script) | Web | `src/main.js` mounts the app at `#app` | [VERIFIED: index.html:10, src/main.js:6-10] |
| `npm run dev` / `build` / `preview` | CLI | Vite scripts | [VERIFIED: package.json:6-10] |
| `window` `online` / `offline` | Browser event | `App.vue` listeners → `syncStore.setOnline` / `triggerSync` | [VERIFIED: src/App.vue:16-22] |
| `@dragstart` / `@dragend` | UI event | `KanbanCard.vue` → `useDragDrop` | [VERIFIED: src/components/KanbanCard.vue:34-36] |
| `@dragover` / `@dragleave` / `@drop` | UI event | `KanbanColumn.vue` → `useDragDrop` | [VERIFIED: src/components/KanbanColumn.vue:46-48] |
| Add-card form submit | UI event | `KanbanColumn.submitCard` → `boardStore.addCard` | [VERIFIED: src/components/KanbanColumn.vue:33-39] |
| Delete button | UI event | `KanbanCard.handleDelete` → `boardStore.deleteCard` | [VERIFIED: src/components/KanbanCard.vue:23-26, 58] |
| "Sync Now" button | UI event | `SyncStatus.handleSync` → `syncStore.triggerSync` | [VERIFIED: src/components/SyncStatus.vue:6-8, 28-34] |
| HTTP routes | — | None | [NOT_FOUND: no server routes and no client router registration; the SPA renders a single view] |

---

## 8. Technology Stack Summary

| Layer | Technology | Evidence |
|-------|------------|----------|
| Frontend framework | Vue 3 (Composition API, `<script setup>`) | [VERIFIED: package.json:12, src/App.vue:1] |
| State management | Pinia setup stores | [VERIFIED: package.json:13, src/stores/boardStore.js:17] |
| Build tool | Vite + `@vitejs/plugin-vue` | [VERIFIED: package.json:17-18, vite.config.js:4-6] |
| Persistence | Browser localStorage (single key `kanban-board-data`) | [VERIFIED: src/services/persistence.js:12, 24] |
| Backend / server | None — in-memory mock only | [VERIFIED: src/services/api.js:17-21] |
| Database | None | [NOT_FOUND: no database client, driver, or ORM in src/ or package.json] |
| Language | JavaScript with JSDoc type comments (no TypeScript) | [VERIFIED: src/types/index.js:1-6, 48-49] |

---

## Why This Example is GOOD

1. **Pinned, checkable metadata** — repository, path, commit (`9a69c14`), and date let a reader check out the exact revision and re-verify every claim.
2. **Self-verifying** — the document states its own verify command and passes it (exit 0): all `path:line` citations resolve, and every quoted block matches its cited slice.
3. **Accurate summary counts** — the Verification Summary numbers come from `verify.py`'s parsed tag counts, not from estimation.
4. **Only canonical tags** — every claim uses one of `[VERIFIED: path:line]`, `[INFERRED]`, `[NOT_FOUND: search description]`, `[ASSUMED: reason]`, `[NEEDS_VERIFICATION]`. Severity labels like `[CRITICAL GAP]` are not tags; critical findings live in section 6 as evidence-backed Known Issues rows.
5. **Machine-parseable citations** — `path:line` / `path:start-end` with no backticks inside the brackets and paths relative to the app root, so the verifier resolves 100% of them.
6. **Exact quotes** — code excerpts are verbatim copy-paste of the cited slice (phase-2 similarity 1.0); nothing is paraphrased into "code".
7. **Discovery, not tracing** — section 3 uses tables for surfaces and data movement, contains no ASCII arrow diagrams and no numbered step-by-step traces, and section 3.3 defers all execution tracing to `02-code-flows.md`.
8. **Absence is a search, not silence** — `[NOT_FOUND]` entries record what was searched (unused `vue-router`, no network calls, no lockfile, no database) so a reader can re-run the search.
9. **Honest versioning** — dependency versions are quoted as the declared ranges from `package.json` (e.g., `^3.4.0`), not invented exact versions, and the missing lockfile is called out explicitly.
10. **Inference and assumption are labeled** — conclusions (`[INFERRED]`) and conventions (`[ASSUMED]`) are visibly separated from read-and-verified fact.
