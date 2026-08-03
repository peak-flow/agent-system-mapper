# Architecture Overview: Vue Kanban Board

> ⚠️ **BAD EXAMPLE — DO NOT IMITATE.** This document demonstrates hallucination patterns — including the subtlest one: real citations with selectively truncated quotes. Each ❌ callout explains a failure. See good-architecture-doc-example.md for the correct approach.

## System Purpose
A real-time collaborative Kanban board built with Vue 3 and Pinia, featuring automatic synchronization and offline support. Cards sync instantly across all clients with conflict-free updates.

> **❌ PROBLEMS:**
> - "Real-time collaborative" — there is no server and no other clients. The API service's own header says "No actual server exists" (`src/services/api.js:5-6`).
> - "Automatic synchronization" — the board store's architecture note says the opposite: "Changes here are NOT automatically persisted to server" (`src/stores/boardStore.js:10-11`).
> - "Conflict-free updates" — the sync store's note lists "No conflict resolution" as a known gap (`src/stores/syncStore.js:12`).
> - No Metadata table, no commit hash, no date, no verification tags anywhere in the document. Nothing is checkable at a fixed revision.

## Technology Stack
- Vue 3 with Composition API for reactive UI
- Pinia for state management with automatic persistence
- Real-time sync via built-in API service
- Offline-first architecture with seamless reconnection

> **❌ PROBLEMS:**
> - No citations. The two true items (Vue 3, Pinia) are stated without evidence (`package.json:12-13` would prove them), so the reader cannot tell them apart from the false ones.
> - "Automatic persistence" — persistence is a manual `saveToLocal()` call inside each store action (`src/stores/boardStore.js:60-66`, called at 89, 106, 121, 148). Nothing subscribes to state changes to persist them.
> - "Real-time sync via built-in API service" — the "API service" is an in-memory mock: `let serverState = { ... }` that "resets on refresh" (`src/services/api.js:17-21`).
> - "Seamless reconnection" — the reconnect watcher syncs without any conflict check (`src/stores/syncStore.js:101-102`) and the sync loop stops on the first error (`src/stores/syncStore.js:81`).

## Core Architecture

### State Management
The application uses Pinia stores for centralized state management. The `boardStore` handles all board operations with automatic reactivity.

```javascript
// State automatically syncs when changed
const columns = ref([])
const cards = ref({})
```
Reference: `src/stores/boardStore.js:19-20`

When cards are modified, Vue's reactivity system ensures all components update and changes persist automatically.

> **❌ PROBLEMS:**
> - The quoted block is doctored. The comment `// State automatically syncs when changed` does not exist anywhere in the file — it was invented and pasted above two real lines. The real lines 19-20 read `const columns = ref([])` and `const cards = ref({}) // { [cardId]: card }`; the real inline comment was stripped and a fake one substituted.
> - The reference says lines 19-20 but the block shows three lines — the citation resolves, yet the quote is not the cited code. A resolving citation is not the same as a faithful quote.
> - "Changes persist automatically" — false. Every mutation calls `saveToLocal()` explicitly (`src/stores/boardStore.js:89`), and the file's header comment says changes are "NOT automatically persisted to server" (`src/stores/boardStore.js:10-11`).

### Synchronization Flow
The sync system provides real-time updates:

1. User makes a change (add/move/delete card)
2. Pinia reactivity triggers watchers
3. Changes sync automatically to server
4. All clients receive updates

The watcher at line 167-174 in `boardStore.js` handles automatic sync when cards change:

```javascript
watch(
  () => Object.keys(cards.value).length,
  (newCount, oldCount) => {
    console.log(`Card count changed: ${oldCount} → ${newCount}`)
  }
)
```
Reference: `src/stores/boardStore.js:167-174`

> **❌ PROBLEMS:**
> - Numbered step-by-step tracing is banned in architecture overviews — execution tracing belongs in code-flow documentation. Steps 3 and 4 are also simply false: nothing syncs automatically and there are no other clients.
> - **Truncated quote.** The citation `boardStore.js:167-174` resolves, and the code shown is real — but lines 171-172 were silently deleted from the middle of the block:
>
> ```javascript
>       // This log makes it LOOK like we're tracking changes
>       // but no actual sync happens here
> ```
>
> The removed lines state, in the authors' own words, that this watcher does **no** sync — the exact opposite of the claim it is quoted to support. The wart comment directly above the watcher (`src/stores/boardStore.js:165-166`) says the same and was also omitted.

### API Layer
The API service handles all server communication with automatic retry and conflict resolution:

```javascript
async syncCard(card) {
  serverState.cards[card.id] = {
    ...card,
    syncedAt: new Date().toISOString(),
  }
  return { success: true, card: serverState.cards[card.id] }
}
```
Reference: `src/services/api.js:33-49`

> **❌ PROBLEMS:**
> - **This is the subtlest failure in the document: a real citation with a selectively truncated quote.** The citation `src/services/api.js:33-49` resolves, and every quoted line is genuine — but the quote silently drops lines 34-41 and 46 from the middle of the cited range. Here is what was cut (`src/services/api.js:34-41`):
>
> ```javascript
>     await delay(200 + Math.random() * 300) // Simulate network
>
>     // Simulate occasional failures (10% chance)
>     if (Math.random() < 0.1) {
>       throw new Error('Network error - sync failed')
>     }
>
>     // Wart: No version checking - blindly overwrites
> ```
>
> - The dropped lines refute both halves of the claim. "Automatic retry": the function randomly *throws* 10% of the time (`src/services/api.js:37-38`) and no layer retries — the sync loop breaks on the first error (`src/stores/syncStore.js:81`). "Conflict resolution": the authors' own comment on the dropped line 41 says "No version checking - blindly overwrites".
> - "Handles all server communication" — the surviving lines write to `serverState`, which is a module-level in-memory object that "resets on refresh" (`src/services/api.js:17-21`). There is no server communication at all.
> - Lesson: a verifier can confirm the citation resolves and the quoted lines exist — only re-reading the *whole* cited range reveals that the quote was curated to invert the code's meaning. Citations that resolve are not the same as claims that are true.

### Drag and Drop
Drag operations use the composable pattern for reusable logic. When a card is dropped, it's immediately synced:

```javascript
boardStore.moveCard(cardId, fromColumnId, toColumnId, index)
```
Reference: `src/composables/useDragDrop.js:62`

> **❌ PROBLEMS:**
> - **Truncated quote again.** Line 62 is real, but the two comment lines immediately above it (`src/composables/useDragDrop.js:60-61`) were cut:
>
> ```javascript
>     // Wart: Immediate mutation without optimistic UI pattern
>     // This treats the drag as already "done" but it's not synced
> ```
>
> The omitted comment says the drop is **not** synced — the opposite of "it's immediately synced".
> - What `moveCard` actually does is mark the card `pending` and queue it (`src/stores/boardStore.js:146-149`); no sync is triggered by a drop.

### Offline Support
The persistence layer uses localStorage with IndexedDB for larger datasets:

```javascript
save(data) {
  localStorage.setItem(STORAGE_KEY, serialized)
  return true
}
```
Reference: `src/services/persistence.js:18-31`

Data is automatically synced when the connection is restored.

> **❌ PROBLEMS:**
> - "With IndexedDB for larger datasets" — fabricated. The file header says "Using localStorage (not IndexedDB) for simplicity" (`src/services/persistence.js:8`), and IndexedDB exists only as a commented-out stub: "// Wart: No IndexedDB implementation despite being mentioned in requirements" (`src/services/persistence.js:75-76`).
> - **Truncated quote.** The citation spans 14 lines (18-31) but the block shows 4. The cut lines contain the `try`/`catch` whose comment reads "// Wart: Silently fails on quota exceeded" (`src/services/persistence.js:26-30`) — hiding that "offline support" can silently lose data. The quote also drops lines 20-23, where `serialized` is built, leaving the shown code referencing an undefined variable.
> - "Automatically synced when the connection is restored" — the reconnect watcher exists (`src/stores/syncStore.js:103-108`) but the claim omits that it syncs with no conflict check (`src/stores/syncStore.js:101-102`) and that the "server" it syncs to is in-memory (`src/services/api.js:17-21`).

## Data Flow

```
User Action → Pinia Store → Reactivity → Server Sync → All Clients
```

The sync store manages connection state and queues operations when offline:

```javascript
const syncStatus = computed(() => {
  if (!isOnline.value) return 'offline'
  if (isSyncing.value) return 'syncing'
  if (pendingQueue.value.length > 0) return 'pending'
  return 'synced'
})
```
Reference: `src/stores/syncStore.js:26-31`

> **❌ PROBLEMS:**
> - ASCII arrow flow diagrams are banned in architecture overviews — and this one is wrong twice over: "Server Sync" reaches only an in-memory mock (`src/services/api.js:17-21`) and "All Clients" do not exist.
> - The `syncStatus` quote is real and accurate — but the prose around it launders it: `'synced'` here means only that the mock returned success. The API's own header warns "The UI will show \"synced\" even though nothing actually synced" (`src/services/api.js:11`). Accurate quotes can still be used to support inaccurate narratives.

## Key Features
- Real-time collaborative editing
- Automatic conflict resolution
- Seamless offline/online transitions
- Drag-and-drop with optimistic updates
- Persistent storage across sessions

> **❌ PROBLEMS:**
> - Every bullet is false or misleading, and none carries a tag or citation:
>   - "Real-time collaborative editing" — no server, no other clients (`src/services/api.js:5-6`).
>   - "Automatic conflict resolution" — "No conflict resolution" is a listed gap (`src/stores/syncStore.js:12`) and the mock "blindly overwrites" (`src/services/api.js:41`).
>   - "Seamless offline/online transitions" — sync stops on the first error with no retry (`src/stores/syncStore.js:76-81`).
>   - "Optimistic updates" — mutations are immediate with no rollback path (`src/composables/useDragDrop.js:60-62`).
>   - "Persistent storage across sessions" — localStorage persists, but everything "synced" lives in a variable that resets on refresh (`src/services/api.js:17`).

## Component Architecture
Components follow a smart container / dumb presenter pattern:
- `KanbanBoard.vue` - Container managing board state
- `KanbanColumn.vue` - Column container with drag zones
- `KanbanCard.vue` - Presentational card component
- `SyncStatus.vue` - Connection status indicator

All components react automatically to store changes through Pinia's built-in reactivity.

> **❌ PROBLEMS:**
> - The "pattern" is asserted, not verified. `KanbanBoard.vue` manages no state — it is a 16-line pass-through that renders columns from the store (`src/components/KanbanBoard.vue:10-14`).
> - `KanbanCard.vue` is not a "presentational" component: it imports the board store and mutates it directly in `handleDelete()` (`src/components/KanbanCard.vue:23-26`).
> - No file:line evidence for any row, so the pattern claim cannot be checked without re-reading every component.

---

## Why This Example is BAD

The headline lesson: **selective quoting — citations that resolve are not the same as claims that are true.** Every `Reference:` line in this document points at a real file and real lines, and every quoted line genuinely exists. The document still lies, because quotes were truncated or doctored until the code appeared to say the opposite of what it says. A structural verifier passes the citations; only re-reading the full cited ranges exposes the fraud. In detail:

1. **Selective quoting to invert meaning** — claims "automatic retry and conflict resolution", quoting `src/services/api.js:33-49` while silently dropping lines 34-41: the 10% random-failure simulation (`src/services/api.js:37-38`) and the comment "No version checking - blindly overwrites" (`src/services/api.js:41`). Reality: no retry exists anywhere (`src/stores/syncStore.js:81` breaks on first error) and conflicts are never checked.
2. **Truncating self-refuting comments** — quotes the card-count watcher (`src/stores/boardStore.js:167-174`) as "automatic sync" while deleting its middle lines 171-172, which read "no actual sync happens here". Reality: the watcher only logs.
3. **Quoting a line without its negating context** — "when a card is dropped, it's immediately synced" cites `src/composables/useDragDrop.js:62` while cutting lines 60-61 directly above: "it's not synced". Reality: a drop only marks the card `pending` (`src/stores/boardStore.js:146-149`).
4. **Doctored quote** — inserts a fabricated comment `// State automatically syncs when changed` above real code cited as `src/stores/boardStore.js:19-20`. Reality: no such comment exists in the file, and the store header says changes are "NOT automatically persisted" (`src/stores/boardStore.js:10-11`).
5. **Fabricated capability** — "localStorage with IndexedDB for larger datasets". Reality: "Using localStorage (not IndexedDB) for simplicity" (`src/services/persistence.js:8`); IndexedDB is a commented-out stub (`src/services/persistence.js:75-76`). The `save()` quote also hides the silent quota-failure catch (`src/services/persistence.js:26-30`).
6. **Invented system category** — "real-time collaborative", "all clients receive updates". Reality: "No actual server exists" (`src/services/api.js:6`); the "server" is an in-memory variable that resets on refresh (`src/services/api.js:17-21`).
7. **Accurate quote, misleading frame** — the real `syncStatus` computed (`src/stores/syncStore.js:26-31`) is used to imply server-backed state, while omitting "The UI will show \"synced\" even though nothing actually synced" (`src/services/api.js:11`).
8. **Banned formats** — a numbered step-by-step execution trace ("Synchronization Flow") and an ASCII arrow diagram ("Data Flow") in an architecture overview; both belong in code-flow documentation, as tables or pointers here.
9. **No verification apparatus** — no Metadata table, no commit hash, no date, no verification tags, no Verification Summary, no `[NOT_FOUND]` searches. None of the five canonical tags appears even once, so unverified marketing language ("Key Features") is indistinguishable from read code.
10. **Unverifiable pattern claims** — "smart container / dumb presenter" asserted with no evidence, contradicted by `KanbanCard.vue:23-26` mutating the store directly.
