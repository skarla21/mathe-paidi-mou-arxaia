import { ref, type Ref } from 'vue'

/**
 * HTML5 drag-and-drop reorder for a list of row ids (or any primitive keyed list).
 */
export function useDragReorderList<T extends { id: string }>(orderedRows: Ref<T[]>) {
  const draggedIndex = ref<number | null>(null)

  function onDragStart(e: DragEvent, index: number) {
    draggedIndex.value = index
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('text/plain', String(index))
    if (e.target instanceof HTMLElement) e.target.classList.add('opacity-50')
  }

  function onDragEnd(e: DragEvent) {
    draggedIndex.value = null
    if (e.target instanceof HTMLElement) e.target.classList.remove('opacity-50')
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
  }

  function onDrop(e: DragEvent, dropIndex: number) {
    e.preventDefault()
    const from = draggedIndex.value
    if (from == null || from === dropIndex) return
    const rows = [...orderedRows.value]
    const [removed] = rows.splice(from, 1)
    if (removed == null) return
    rows.splice(dropIndex, 0, removed)
    orderedRows.value = rows
  }

  return { draggedIndex, onDragStart, onDragEnd, onDragOver, onDrop }
}
