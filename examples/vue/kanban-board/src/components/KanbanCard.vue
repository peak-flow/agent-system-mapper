<script setup>
import { useDragDrop } from '../composables/useDragDrop'
import { useBoardStore } from '../stores/boardStore'

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
  columnId: {
    type: String,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
})

const boardStore = useBoardStore()
const { onDragStart, onDragEnd } = useDragDrop()

function handleDelete() {
  // Wart: No confirmation, immediate delete
  boardStore.deleteCard(props.card.id)
}
</script>

<template>
  <div
    class="card"
    :class="card.syncStatus"
    :data-index="index"
    draggable="true"
    @dragstart="onDragStart($event, card.id, columnId)"
    @dragend="onDragEnd"
  >
    <div class="card-content">
      {{ card.title }}
    </div>

    <div class="card-meta">
      <span
        v-if="card.syncStatus === 'pending'"
        class="sync-indicator pending"
        title="Pending sync"
      >
        ●
      </span>
      <span
        v-else-if="card.syncStatus === 'synced'"
        class="sync-indicator synced"
        title="Synced"
      >
        ✓
      </span>

      <button @click.stop="handleDelete" class="delete-btn" title="Delete card">
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.card {
  position: relative;
}

.card-content {
  word-wrap: break-word;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
}

.sync-indicator {
  font-size: 10px;
}

.sync-indicator.pending {
  color: #f5a623;
}

.sync-indicator.synced {
  color: #00c853;
}

.delete-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #f44336;
}
</style>
