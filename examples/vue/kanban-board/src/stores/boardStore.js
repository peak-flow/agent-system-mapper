import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { persistence } from '../services/persistence'
import { useSyncStore } from './syncStore'

/**
 * Main board store - manages columns and cards
 *
 * ARCHITECTURE NOTE:
 * This store manages LOCAL state. Changes here are NOT automatically
 * persisted to server. The sync flow is:
 *
 * UI action → store mutation → local persistence → sync queue → server
 *
 * The UI reflects optimistic state that may not match server.
 */
export const useBoardStore = defineStore('board', () => {
  // State
  const columns = ref([])
  const cards = ref({}) // { [cardId]: card }
  const lastSyncedAt = ref(null)

  // Computed
  const getColumnCards = computed(() => {
    return (columnId) => {
      const column = columns.value.find(c => c.id === columnId)
      if (!column) return []
      return column.cardIds.map(id => cards.value[id]).filter(Boolean)
    }
  })

  const pendingChanges = computed(() => {
    return Object.values(cards.value).filter(c => c.syncStatus === 'pending')
  })

  const hasPendingChanges = computed(() => pendingChanges.value.length > 0)

  // Actions
  function loadFromLocal() {
    const data = persistence.load()
    if (data) {
      columns.value = data.columns || []
      cards.value = data.cards || {}
      lastSyncedAt.value = data.lastSyncedAt
    } else {
      // Initialize with default columns
      initializeBoard()
    }
  }

  function initializeBoard() {
    columns.value = [
      { id: 'todo', title: 'To Do', cardIds: [] },
      { id: 'doing', title: 'In Progress', cardIds: [] },
      { id: 'done', title: 'Done', cardIds: [] },
    ]
    saveToLocal()
  }

  function saveToLocal() {
    persistence.save({
      columns: columns.value,
      cards: cards.value,
      lastSyncedAt: lastSyncedAt.value,
    })
  }

  function addCard(columnId, title) {
    const id = `card-${Date.now()}`
    const card = {
      id,
      title,
      description: '',
      columnId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Wart: syncStatus is optimistic - UI shows "pending" but
      // no actual sync is triggered automatically
      syncStatus: 'pending',
    }

    cards.value[id] = card

    const column = columns.value.find(c => c.id === columnId)
    if (column) {
      column.cardIds.push(id)
    }

    saveToLocal()
    // Wart: Should queue for sync but just marks as pending
    markPendingSync(id)

    return card
  }

  function updateCard(cardId, updates) {
    const card = cards.value[cardId]
    if (!card) return

    Object.assign(card, {
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
    })

    saveToLocal()
    markPendingSync(cardId)
  }

  function deleteCard(cardId) {
    const card = cards.value[cardId]
    if (!card) return

    // Remove from column
    const column = columns.value.find(c => c.id === card.columnId)
    if (column) {
      column.cardIds = column.cardIds.filter(id => id !== cardId)
    }

    delete cards.value[cardId]
    saveToLocal()

    // Wart: Deleted cards should be tracked for sync, but aren't
    // This can cause "ghost cards" if delete happens offline
  }

  function moveCard(cardId, fromColumnId, toColumnId, newIndex) {
    const card = cards.value[cardId]
    if (!card) return

    // Remove from old column
    const fromColumn = columns.value.find(c => c.id === fromColumnId)
    if (fromColumn) {
      fromColumn.cardIds = fromColumn.cardIds.filter(id => id !== cardId)
    }

    // Add to new column
    const toColumn = columns.value.find(c => c.id === toColumnId)
    if (toColumn) {
      toColumn.cardIds.splice(newIndex, 0, cardId)
    }

    // Update card's column reference
    card.columnId = toColumnId
    card.updatedAt = new Date().toISOString()
    card.syncStatus = 'pending'

    saveToLocal()
    markPendingSync(cardId)
  }

  function markPendingSync(cardId) {
    const syncStore = useSyncStore()
    syncStore.addToPendingQueue(cardId)
  }

  function markSynced(cardId) {
    const card = cards.value[cardId]
    if (card) {
      card.syncStatus = 'synced'
      saveToLocal()
    }
  }

  // Wart: This watcher triggers side-effects but doesn't guarantee
  // the side-effect completes. Looks reactive, but isn't reliable.
  watch(
    () => Object.keys(cards.value).length,
    (newCount, oldCount) => {
      console.log(`Card count changed: ${oldCount} → ${newCount}`)
      // This log makes it LOOK like we're tracking changes
      // but no actual sync happens here
    }
  )

  return {
    columns,
    cards,
    lastSyncedAt,
    getColumnCards,
    pendingChanges,
    hasPendingChanges,
    loadFromLocal,
    saveToLocal,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    markSynced,
    initializeBoard,
  }
})
