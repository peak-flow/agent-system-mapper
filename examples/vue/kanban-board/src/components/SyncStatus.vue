<script setup>
import { useSyncStore } from '../stores/syncStore'

const syncStore = useSyncStore()

function handleSync() {
  syncStore.triggerSync()
}
</script>

<template>
  <div class="sync-status" :class="syncStore.syncStatus">
    <span class="status-text">
      <template v-if="syncStore.syncStatus === 'offline'">
        Offline
      </template>
      <template v-else-if="syncStore.syncStatus === 'syncing'">
        Syncing...
      </template>
      <template v-else-if="syncStore.syncStatus === 'pending'">
        {{ syncStore.pendingCount }} pending
      </template>
      <template v-else>
        Synced
      </template>
    </span>

    <button
      v-if="syncStore.isOnline && syncStore.pendingCount > 0 && !syncStore.isSyncing"
      @click="handleSync"
      class="sync-btn"
    >
      Sync Now
    </button>

    <!-- Wart: Shows error but no way to retry or see details -->
    <span v-if="syncStore.lastSyncError" class="error-indicator" title="Sync error">
      ⚠
    </span>
  </div>
</template>

<style scoped>
.sync-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sync-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.sync-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.error-indicator {
  color: #ff5722;
}
</style>
