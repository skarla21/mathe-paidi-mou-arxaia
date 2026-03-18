<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiInput from '~/components/ui/Input.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiAlertDialogRoot from '~/components/ui/alert-dialog/AlertDialogRoot.vue'
import UiAlertDialogPortal from '~/components/ui/alert-dialog/AlertDialogPortal.vue'
import UiAlertDialogOverlay from '~/components/ui/alert-dialog/AlertDialogOverlay.vue'
import UiAlertDialogContent from '~/components/ui/alert-dialog/AlertDialogContent.vue'
import UiAlertDialogHeader from '~/components/ui/alert-dialog/AlertDialogHeader.vue'
import UiAlertDialogFooter from '~/components/ui/alert-dialog/AlertDialogFooter.vue'
import UiAlertDialogTitle from '~/components/ui/alert-dialog/AlertDialogTitle.vue'
import UiAlertDialogDescription from '~/components/ui/alert-dialog/AlertDialogDescription.vue'
import UiAlertDialogCancel from '~/components/ui/alert-dialog/AlertDialogCancel.vue'
import UiAlertDialogAction from '~/components/ui/alert-dialog/AlertDialogAction.vue'
import AdminGradeModal from '~/components/admin/GradeModal.vue'
import type { Grade } from '~/types/database'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.gradesTitle')}` }))

const adminFetch = useAdminFetch()
const grades = ref<Grade[]>([])
const loading = ref(true)
const search = ref('')
const modalOpen = ref(false)
const editingGrade = ref<Grade | null>(null)
const deleteDialogOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleteLoading = ref(false)
const saveOrderLoading = ref(false)
const orderedIds = ref<string[]>([])
const draggedIndex = ref<number | null>(null)

const filteredGrades = computed(() => {
  if (!search.value) return grades.value
  const q = search.value.toLowerCase()
  return grades.value.filter(g => g.name.toLowerCase().includes(q))
})

const displayedGrades = computed(() => {
  const list = filteredGrades.value
  if (orderedIds.value.length !== list.length) return list
  return orderedIds.value
    .map(id => list.find(g => g.id === id))
    .filter((g): g is Grade => !!g)
})

const hasOrderChanged = computed(() => {
  if (search.value) return false
  const list = filteredGrades.value
  if (orderedIds.value.length !== list.length) return false
  return orderedIds.value.some((id, i) => list[i]?.id !== id)
})

const canReorder = computed(() => !search.value)

function syncOrderedIds() {
  orderedIds.value = filteredGrades.value.map(g => g.id)
}

watch(filteredGrades, syncOrderedIds, { deep: true })

async function fetchGrades() {
  loading.value = true
  try {
    grades.value = await adminFetch<Grade[]>('/api/admin/grades')
    syncOrderedIds()
  } catch {
    grades.value = []
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

onMounted(fetchGrades)

function openCreate() { editingGrade.value = null; modalOpen.value = true }
function openEdit(g: Grade) { editingGrade.value = g; modalOpen.value = true }
function openDelete(id: string) { deletingId.value = id; deleteDialogOpen.value = true }

async function confirmDelete() {
  if (!deletingId.value) return
  deleteLoading.value = true
  try {
    await adminFetch(`/api/admin/grades/${deletingId.value}`, { method: 'DELETE' })
    await fetchGrades()
    deleteDialogOpen.value = false
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? t('common.error'))
  } finally {
    deleteLoading.value = false
  }
}

async function saveOrder() {
  if (!hasOrderChanged.value) return
  saveOrderLoading.value = true
  try {
    await adminFetch('/api/admin/grades/reorder', { method: 'PATCH', body: { ids: orderedIds.value } })
    toast.success(t('admin.saveOrderSuccess'))
    await fetchGrades()
  } catch {
    toast.error(t('admin.saveOrderError'))
  } finally {
    saveOrderLoading.value = false
  }
}

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
  const ids = [...orderedIds.value]
  const [removed] = ids.splice(from, 1)
  if (removed == null) return
  ids.splice(dropIndex, 0, removed)
  orderedIds.value = ids
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold font-heading">{{ t('admin.gradesTitle') }}</h1>
      <div class="flex items-center gap-2">
        <UiButton
          :disabled="!canReorder || !hasOrderChanged || saveOrderLoading"
          @click="saveOrder"
        >
          {{ saveOrderLoading ? t('common.loading') : t('admin.saveOrder') }}
        </UiButton>
        <UiButton @click="openCreate">
          <VIcon name="bi-plus-circle" class="mr-2 size-4" />
          {{ t('admin.modal.create') }}
        </UiButton>
      </div>
    </div>

    <!-- Search -->
    <div class="relative mb-6">
      <VIcon name="bi-search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <UiInput v-model="search" :placeholder="t('admin.search')" class="pl-9" />
    </div>

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="space-y-3">
        <UiCard v-for="i in 5" :key="i">
          <UiCardContent class="p-4 flex items-center gap-4">
            <UiSkeleton class="size-8 shrink-0" />
            <UiSkeleton class="h-4 flex-1" />
          </UiCardContent>
        </UiCard>
      </div>
    </template>

    <!-- Cards -->
    <template v-else>
      <div v-if="!displayedGrades.length" class="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <VIcon name="bi-inbox" class="size-12 mx-auto mb-3 opacity-50" />
        <p>{{ t('admin.gradesEmpty') }}</p>
      </div>
      <div v-else class="space-y-3">
        <UiCard
          v-for="(g, index) in displayedGrades"
          :key="g.id"
          class="transition-opacity"
          :draggable="canReorder"
          @dragstart="onDragStart($event, index)"
          @dragend="onDragEnd"
          @dragover="onDragOver"
          @drop="onDrop($event, index)"
        >
          <UiCardContent class="p-4 flex items-center gap-4">
            <div
              class="cursor-grab active:cursor-grabbing shrink-0 rounded p-1 hover:bg-muted text-muted-foreground"
              aria-label="Drag to reorder"
            >
              <VIcon name="bi-grip-vertical" class="size-5" />
            </div>
            <div class="size-12 rounded bg-muted shrink-0 flex items-center justify-center">
              <VIcon name="bi-mortarboard" class="size-6 text-muted-foreground" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-medium">{{ g.name }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UiButton size="sm" variant="outline" @click.stop="openEdit(g)">{{ t('admin.modal.edit') }}</UiButton>
              <UiButton size="sm" variant="destructive" @click.stop="openDelete(g.id)">{{ t('admin.modal.delete') }}</UiButton>
            </div>
          </UiCardContent>
        </UiCard>
      </div>
    </template>

    <AdminGradeModal :open="modalOpen" :grade="editingGrade" @close="modalOpen = false" @saved="fetchGrades" />

    <UiAlertDialogRoot v-model:open="deleteDialogOpen">
      <UiAlertDialogPortal>
        <UiAlertDialogOverlay />
        <UiAlertDialogContent>
          <UiAlertDialogHeader>
            <UiAlertDialogTitle>{{ t('admin.modal.deleteTitle') }}</UiAlertDialogTitle>
            <UiAlertDialogDescription>{{ t('admin.modal.confirmDelete') }}</UiAlertDialogDescription>
          </UiAlertDialogHeader>
          <UiAlertDialogFooter>
            <UiAlertDialogCancel><UiButton variant="outline">{{ t('admin.modal.cancel') }}</UiButton></UiAlertDialogCancel>
            <UiAlertDialogAction as-child>
              <UiButton variant="destructive" :disabled="deleteLoading" @click="confirmDelete">{{ t('admin.modal.delete') }}</UiButton>
            </UiAlertDialogAction>
          </UiAlertDialogFooter>
        </UiAlertDialogContent>
      </UiAlertDialogPortal>
    </UiAlertDialogRoot>
  </div>
</template>
