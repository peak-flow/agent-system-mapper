import { ref } from 'vue'
import { useBoardStore } from '../stores/boardStore'

/**
 * Drag and drop composable
 *
 * ARCHITECTURE NOTE:
 * Handles drag state and drop logic.
 * Wart: Treats drag events as immediate business logic
 * instead of optimistic UI that needs confirmation.
 */
export function useDragDrop() {
  const boardStore = useBoardStore()

  const draggingCard = ref(null)
  const dragOverColumn = ref(null)
  const dropIndex = ref(null)

  function onDragStart(event, cardId, columnId) {
    draggingCard.value = { cardId, columnId }
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', cardId)

    // Add dragging class after a tick
    requestAnimationFrame(() => {
      event.target.classList.add('dragging')
    })
  }

  function onDragEnd(event) {
    event.target.classList.remove('dragging')
    draggingCard.value = null
    dragOverColumn.value = null
    dropIndex.value = null
  }

  function onDragOver(event, columnId) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    dragOverColumn.value = columnId

    // Calculate drop index based on mouse position
    // Wart: Simplified - always drops at end
    dropIndex.value = getDropIndex(event)
  }

  function onDragLeave() {
    dragOverColumn.value = null
    dropIndex.value = null
  }

  function onDrop(event, toColumnId) {
    event.preventDefault()

    if (!draggingCard.value) return

    const { cardId, columnId: fromColumnId } = draggingCard.value
    const index = dropIndex.value ?? 0

    // Wart: Immediate mutation without optimistic UI pattern
    // This treats the drag as already "done" but it's not synced
    boardStore.moveCard(cardId, fromColumnId, toColumnId, index)

    // Reset drag state
    draggingCard.value = null
    dragOverColumn.value = null
    dropIndex.value = null
  }

  function getDropIndex(event) {
    // Simplified: get index from data attribute or default to end
    const target = event.target.closest('.card')
    if (target) {
      return parseInt(target.dataset.index || '0', 10)
    }
    return 999 // End of list
  }

  return {
    draggingCard,
    dragOverColumn,
    dropIndex,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
  }
}
