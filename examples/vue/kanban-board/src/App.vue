<script setup>
import { onMounted } from 'vue'
import { useBoardStore } from './stores/boardStore'
import { useSyncStore } from './stores/syncStore'
import KanbanBoard from './components/KanbanBoard.vue'
import SyncStatus from './components/SyncStatus.vue'

const boardStore = useBoardStore()
const syncStore = useSyncStore()

onMounted(() => {
  // Load from local persistence on mount
  boardStore.loadFromLocal()

  // Set up online/offline listeners
  window.addEventListener('online', () => {
    syncStore.setOnline(true)
    syncStore.triggerSync()
  })
  window.addEventListener('offline', () => {
    syncStore.setOnline(false)
  })
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Kanban Board</h1>
      <SyncStatus />
    </header>
    <KanbanBoard />
  </div>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.15);
  color: white;
}

.app-header h1 {
  font-size: 20px;
}
</style>
