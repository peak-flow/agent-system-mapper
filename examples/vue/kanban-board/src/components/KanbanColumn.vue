<script setup>
import { ref, computed } from 'vue'
import { useBoardStore } from '../stores/boardStore'
import { useDragDrop } from '../composables/useDragDrop'
import KanbanCard from './KanbanCard.vue'

const props = defineProps({
  column: {
    type: Object,
    required: true,
  },
})

const boardStore = useBoardStore()
const { dragOverColumn, onDragOver, onDragLeave, onDrop } = useDragDrop()

const newCardTitle = ref('')
const isAddingCard = ref(false)

const cards = computed(() => boardStore.getColumnCards(props.column.id))

const isDropTarget = computed(() => dragOverColumn.value === props.column.id)

function startAddingCard() {
  isAddingCard.value = true
}

function cancelAddCard() {
  isAddingCard.value = false
  newCardTitle.value = ''
}

function submitCard() {
  if (newCardTitle.value.trim()) {
    boardStore.addCard(props.column.id, newCardTitle.value.trim())
    newCardTitle.value = ''
    isAddingCard.value = false
  }
}
</script>

<template>
  <div
    class="column"
    :class="{ 'drop-target': isDropTarget }"
    @dragover="onDragOver($event, column.id)"
    @dragleave="onDragLeave"
    @drop="onDrop($event, column.id)"
  >
    <div class="column-header">
      {{ column.title }}
      <span class="card-count">({{ cards.length }})</span>
    </div>

    <div class="column-cards">
      <KanbanCard
        v-for="(card, index) in cards"
        :key="card.id"
        :card="card"
        :column-id="column.id"
        :index="index"
      />
    </div>

    <!-- Add card form -->
    <div v-if="isAddingCard" class="add-card-form">
      <textarea
        v-model="newCardTitle"
        placeholder="Enter card title..."
        @keyup.enter="submitCard"
        @keyup.escape="cancelAddCard"
        autofocus
      ></textarea>
      <div class="add-card-actions">
        <button @click="submitCard" class="btn-add">Add Card</button>
        <button @click="cancelAddCard" class="btn-cancel">Cancel</button>
      </div>
    </div>

    <button v-else @click="startAddingCard" class="add-card-btn">
      + Add a card
    </button>
  </div>
</template>

<style scoped>
.column.drop-target {
  background: #c8e0f0;
}

.card-count {
  font-weight: normal;
  color: #5e6c84;
  margin-left: 4px;
}

.column-cards {
  min-height: 20px;
}

.add-card-form textarea {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 3px;
  resize: none;
  min-height: 60px;
}

.add-card-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.btn-add {
  background: #5aac44;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 3px;
  cursor: pointer;
}

.btn-cancel {
  background: none;
  border: none;
  cursor: pointer;
}

.add-card-btn {
  width: 100%;
  padding: 8px;
  background: none;
  border: none;
  text-align: left;
  color: #5e6c84;
  cursor: pointer;
  border-radius: 3px;
}

.add-card-btn:hover {
  background: rgba(9, 30, 66, 0.08);
}
</style>
