import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { api } from '../services/api'
import { useBoardStore } from './boardStore'

/**
 * Sync store - manages online/offline state and sync queue
 *
 * ARCHITECTURE NOTE:
 * This store tracks what SHOULD be synced, but actual sync
 * has significant gaps:
 * - No conflict resolution
 * - No retry with backoff
 * - No sync order guarantees
 * - Deletes not tracked
 */
export const useSyncStore = defineStore('sync', () => {
  // State
  const isOnline = ref(navigator.onLine)
  const isSyncing = ref(false)
  const pendingQueue = ref([]) // Card IDs waiting to sync
  const lastSyncError = ref(null)
  const syncAttempts = ref(0)

  // Computed
  const syncStatus = computed(() => {
    if (!isOnline.value) return 'offline'
    if (isSyncing.value) return 'syncing'
    if (pendingQueue.value.length > 0) return 'pending'
    return 'synced'
  })

  const pendingCount = computed(() => pendingQueue.value.length)

  // Actions
  function setOnline(online) {
    isOnline.value = online
  }

  function addToPendingQueue(cardId) {
    if (!pendingQueue.value.includes(cardId)) {
      pendingQueue.value.push(cardId)
    }
  }

  function removeFromPendingQueue(cardId) {
    pendingQueue.value = pendingQueue.value.filter(id => id !== cardId)
  }

  async function triggerSync() {
    if (!isOnline.value || isSyncing.value || pendingQueue.value.length === 0) {
      return
    }

    isSyncing.value = true
    lastSyncError.value = null

    const boardStore = useBoardStore()

    // Wart: Syncs cards one by one, no batching
    // This is slow and doesn't handle ordering
    for (const cardId of [...pendingQueue.value]) {
      const card = boardStore.cards[cardId]
      if (!card) {
        // Card was deleted, remove from queue
        removeFromPendingQueue(cardId)
        continue
      }

      try {
        await api.syncCard(card)
        boardStore.markSynced(cardId)
        removeFromPendingQueue(cardId)
        syncAttempts.value = 0
      } catch (error) {
        // Wart: On error, just logs and continues
        // No retry, no rollback, no conflict detection
        console.error(`Failed to sync card ${cardId}:`, error)
        lastSyncError.value = error.message
        syncAttempts.value++
        break // Stop on first error
      }
    }

    isSyncing.value = false
  }

  async function forceSyncAll() {
    // Wart: "Force sync" doesn't actually verify server state
    // Could overwrite newer server data
    const boardStore = useBoardStore()

    // Add all cards to pending queue
    Object.keys(boardStore.cards).forEach(cardId => {
      addToPendingQueue(cardId)
    })

    await triggerSync()
  }

  // Wart: This watcher auto-syncs when coming online, but doesn't
  // check for conflicts with changes made on server while offline
  watch(isOnline, (online) => {
    if (online && pendingQueue.value.length > 0) {
      // Delay to avoid immediate sync on flaky connections
      setTimeout(() => triggerSync(), 1000)
    }
  })

  return {
    isOnline,
    isSyncing,
    pendingQueue,
    pendingCount,
    lastSyncError,
    syncStatus,
    setOnline,
    addToPendingQueue,
    triggerSync,
    forceSyncAll,
  }
})
