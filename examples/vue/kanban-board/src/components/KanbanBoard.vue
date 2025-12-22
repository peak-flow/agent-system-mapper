<script setup>
import { useBoardStore } from '../stores/boardStore'
import KanbanColumn from './KanbanColumn.vue'

const boardStore = useBoardStore()
</script>

<template>
  <div class="board">
    <KanbanColumn
      v-for="column in boardStore.columns"
      :key="column.id"
      :column="column"
    />
  </div>
</template>
