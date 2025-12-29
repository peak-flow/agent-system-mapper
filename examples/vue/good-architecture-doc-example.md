# Architecture Overview: Vue Kanban Board

## System Purpose
[VERIFIED] A Kanban board UI for organizing cards across columns with local persistence. Includes a mock sync system that simulates server communication but does not provide actual synchronization.

Reference: `src/stores/boardStore.js:6-16` - Architecture note explicitly states "This store manages LOCAL state. Changes here are NOT automatically persisted to server."

## Technology Stack
[VERIFIED]
- Vue 3.5.13 with Composition API (`package.json:14`)
- Pinia 3.0.1 for state management (`package.json:13`)
- Vite 6.1.0 for development/bundling (`package.json:17`)
- No actual backend server - mock API only

## State Architecture

### Board Store (`src/stores/boardStore.js`)
[VERIFIED] Manages columns and cards as reactive state:

```javascript
const columns = ref([])           // Line 19
const cards = ref({})             // Line 20 - Object keyed by card ID
const lastSyncedAt = ref(null)    // Line 21
```

**Data Flow - UI to Persistence:**
1. UI action calls store method (e.g., `addCard`)
2. Store mutates reactive state (line 82: `cards.value[id] = card`)
3. `saveToLocal()` called to persist to localStorage (line 89)
4. `markPendingSync()` adds to sync queue (line 91)
5. [CRITICAL GAP] Sync is NOT triggered automatically

Reference: `src/stores/boardStore.js:68-94`

### Sync Store (`src/stores/syncStore.js`)
[VERIFIED] Tracks sync state but has significant gaps:

```javascript
const isOnline = ref(navigator.onLine)    // Line 19
const isSyncing = ref(false)               // Line 20
const pendingQueue = ref([])               // Line 21 - Card IDs awaiting sync
```

**Missing Functionality:**
[VERIFIED] From architecture comment at lines 7-16:
- No conflict resolution
- No retry with backoff
- No sync order guarantees
- Deletes not tracked

Reference: `src/stores/syncStore.js:7-16`

## Sync Behavior Analysis

### What the UI Shows vs Reality

| UI Indicator | Appears To Mean | Actual Behavior |
|--------------|-----------------|-----------------|
| `pending` (●) | Awaiting sync | Card in local queue, sync must be manually triggered |
| `synced` (✓) | Saved to server | Mock API returned success, data in memory only |
| "Sync Now" button | Sync pending changes | Calls mock API, no real persistence |

Reference: `src/components/KanbanCard.vue:44-56` (indicators), `src/components/SyncStatus.vue:28-34` (button)

### Sync Trigger Path
[VERIFIED] Trace from UI to "sync":

1. User clicks "Sync Now" → `SyncStatus.vue:7` calls `syncStore.triggerSync()`
2. `triggerSync()` iterates pending queue one-by-one (line 62)
3. For each card, calls `api.syncCard(card)` (line 71)
4. Mock API stores in memory variable (line 42-48 of `api.js`)
5. On success, card marked synced (line 72-73)

[CRITICAL] `api.js:17-21` shows "server state" is just:
```javascript
let serverState = {
  cards: {},
  lastModified: null,
}
```
This resets on page refresh. No actual persistence occurs.

### Delete Behavior Gap
[VERIFIED] Deletes are not synced:

```javascript
// Line 110-125 of boardStore.js
function deleteCard(cardId) {
  // ... removes from local state
  // Wart: Deleted cards should be tracked for sync, but aren't
}
```

`api.js:66-68` confirms delete not implemented:
```javascript
async deleteCard(cardId) {
  throw new Error('Delete sync not implemented')
}
```

## Drag and Drop Architecture

### Composable Pattern
[VERIFIED] `useDragDrop.js` encapsulates drag state:

```javascript
const draggingCard = ref(null)      // Line 15
const dragOverColumn = ref(null)    // Line 16
const dropIndex = ref(null)         // Line 17
```

### Optimistic UI Gap
[VERIFIED] Drop treats UI change as complete immediately:

```javascript
// Line 60-62 of useDragDrop.js
// Wart: Immediate mutation without optimistic UI pattern
boardStore.moveCard(cardId, fromColumnId, toColumnId, index)
```

[INFERRED] Proper pattern would:
1. Show optimistic UI state
2. Attempt sync
3. Roll back on failure

Current implementation has no rollback mechanism if sync fails after move.

## Persistence Layer

### localStorage Only
[VERIFIED] `persistence.js` uses localStorage exclusively despite IndexedDB mention:

```javascript
const STORAGE_KEY = 'kanban-board-data'  // Line 12

save(data) {
  localStorage.setItem(STORAGE_KEY, serialized)  // Line 24
}
```

[VERIFIED] Line 75-76 confirms IndexedDB not implemented:
```javascript
// Wart: No IndexedDB implementation despite being mentioned in requirements
```

### Failure Handling
[VERIFIED] Errors silently fail:

```javascript
// persistence.js:27-29
} catch (error) {
  console.error('Failed to save to localStorage:', error)
  return false  // No retry, no user notification
}
```

## Invariants and Guarantees

### What IS Guaranteed
[VERIFIED]
- Local state is reactive (Vue reactivity system)
- Changes persist to localStorage on each mutation
- Pending queue tracks unsynced cards

### What is NOT Guaranteed
[VERIFIED]
- Data survives browser clear/storage quota
- Sync actually reaches a server
- Conflicts are detected or resolved
- Delete operations sync
- Order of sync matches order of operations
- Retry on transient failures

## Component Responsibilities

### KanbanBoard.vue (lines 1-17)
[VERIFIED] Simple container, iterates `boardStore.columns`:
```vue
<KanbanColumn
  v-for="column in boardStore.columns"
  :key="column.id"
  :column="column"
/>
```

### KanbanColumn.vue
[VERIFIED] Handles:
- Card list rendering via computed `getColumnCards` (line 20)
- Drag target zone (lines 46-48)
- Add card form (lines 66-78)

[NOT_FOUND] No column reordering functionality exists.

### KanbanCard.vue
[VERIFIED] Handles:
- Drag source (lines 34-36: `draggable="true"`, `@dragstart`, `@dragend`)
- Delete button (line 58: `@click.stop="handleDelete"`)
- Sync status indicator (lines 44-56)

[VERIFIED] Delete has no confirmation (line 24-26):
```javascript
function handleDelete() {
  // Wart: No confirmation, immediate delete
  boardStore.deleteCard(props.card.id)
}
```

### SyncStatus.vue
[VERIFIED] Shows sync state and provides manual trigger:
- Displays offline/syncing/pending/synced (lines 14-25)
- "Sync Now" button visible when online with pending items (line 29)
- Error indicator shows but no details/retry (lines 37-39)

## Reactive Watchers (Side Effects)

### Board Store Watcher
[VERIFIED] `boardStore.js:167-174` - Logs card count changes but does NOT trigger sync:
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

### Sync Store Watcher
[VERIFIED] `syncStore.js:103-108` - Auto-syncs on reconnect with 1s delay:
```javascript
watch(isOnline, (online) => {
  if (online && pendingQueue.value.length > 0) {
    setTimeout(() => triggerSync(), 1000)
  }
})
```

[CRITICAL GAP] No conflict check with server state before syncing.

## Summary of Architectural Gaps

| Category | Issue | Location |
|----------|-------|----------|
| Sync | No actual server | `api.js:17-21` |
| Sync | Deletes not synced | `api.js:66-68` |
| Sync | No conflict resolution | `syncStore.js:10-11` |
| Sync | No retry logic | `syncStore.js:75-81` |
| Persistence | localStorage only | `persistence.js:24` |
| Persistence | Silent failure | `persistence.js:27-29` |
| UI | Immediate delete | `KanbanCard.vue:24-26` |
| UI | Error display inadequate | `SyncStatus.vue:37-39` |
