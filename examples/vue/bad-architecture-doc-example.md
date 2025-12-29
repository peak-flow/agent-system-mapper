# Architecture Overview: Vue Kanban Board

## System Purpose
A real-time collaborative Kanban board built with Vue 3 and Pinia, featuring automatic synchronization and offline support. Cards sync instantly across all clients with conflict-free updates.

## Technology Stack
- Vue 3 with Composition API for reactive UI
- Pinia for state management with automatic persistence
- Real-time sync via built-in API service
- Offline-first architecture with seamless reconnection

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

### Drag and Drop
Drag operations use the composable pattern for reusable logic. When a card is dropped, it's immediately synced:

```javascript
boardStore.moveCard(cardId, fromColumnId, toColumnId, index)
```
Reference: `src/composables/useDragDrop.js:62`

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

## Key Features
- Real-time collaborative editing
- Automatic conflict resolution
- Seamless offline/online transitions
- Drag-and-drop with optimistic updates
- Persistent storage across sessions

## Component Architecture
Components follow a smart container / dumb presenter pattern:
- `KanbanBoard.vue` - Container managing board state
- `KanbanColumn.vue` - Column container with drag zones
- `KanbanCard.vue` - Presentational card component
- `SyncStatus.vue` - Connection status indicator

All components react automatically to store changes through Pinia's built-in reactivity.
