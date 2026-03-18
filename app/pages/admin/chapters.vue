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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import AdminChapterModal from '~/components/admin/ChapterModal.vue'
import type { Chapter } from '~/types/database'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.chaptersTitle')}` }))

const adminFetch = useAdminFetch()
const chapters = ref<Chapter[]>([])
const grades = ref<{ id: string; name: string }[]>([])
const subjects = ref<{ id: string; name: string; grade_id: string }[]>([])
const loading = ref(true)
const gradeId = ref('__all__')
const subjectId = ref('__all__')
const modalOpen = ref(false)
const editingChapter = ref<Chapter | null>(null)
const deleteDialogOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleteLoading = ref(false)
const saveOrderLoading = ref(false)
const orderedIds = ref<string[]>([])
const draggedIndex = ref<number | null>(null)

const filteredChapters = computed(() => {
  let list = chapters.value
  if (gradeId.value && gradeId.value !== '__all__') list = list.filter(c => c.grade_id === gradeId.value)
  if (subjectId.value && subjectId.value !== '__all__') list = list.filter(c => c.subject_id === subjectId.value)
  return list
})

const filteredSubjects = computed(() =>
  gradeId.value && gradeId.value !== '__all__' ? subjects.value.filter(s => s.grade_id === gradeId.value) : []
)

const displayedChapters = computed(() => {
  const list = filteredChapters.value
  if (orderedIds.value.length !== list.length) return list
  return orderedIds.value
    .map(id => list.find(c => c.id === id))
    .filter((c): c is Chapter => !!c)
})

const hasOrderChanged = computed(() => {
  const list = filteredChapters.value
  if (orderedIds.value.length !== list.length) return false
  return orderedIds.value.some((id, i) => list[i]?.id !== id)
})

function breadcrumb(c: Chapter) {
  const grade = grades.value.find(g => g.id === c.grade_id)
  const subj = c.subjects
  const parts = [grade?.name ?? '', subj?.name ?? '', c.title].filter(Boolean)
  return parts.join(' > ')
}

async function fetchAll() {
  loading.value = true
  try {
    const [ch, gr, sub] = await Promise.all([
      adminFetch<Chapter[]>('/api/admin/chapters'),
      adminFetch<{ id: string; name: string }[]>('/api/admin/grades'),
      adminFetch<{ id: string; name: string; grade_id: string }[]>('/api/admin/subjects'),
    ])
    chapters.value = ch
    grades.value = gr
    subjects.value = sub
    syncOrderedIds()
  } catch {
    chapters.value = []
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

function syncOrderedIds() {
  orderedIds.value = filteredChapters.value.map(c => c.id)
}

watch(gradeId, () => {
  subjectId.value = ''
  syncOrderedIds()
})
watch(subjectId, syncOrderedIds)

watch(filteredChapters, () => {
  syncOrderedIds()
}, { deep: true })

onMounted(fetchAll)

function openCreate() { editingChapter.value = null; modalOpen.value = true }
function openEdit(c: Chapter) { editingChapter.value = c; modalOpen.value = true }
function openDelete(id: string) { deletingId.value = id; deleteDialogOpen.value = true }

async function confirmDelete() {
  if (!deletingId.value) return
  deleteLoading.value = true
  try {
    await adminFetch(`/api/admin/chapters/${deletingId.value}`, { method: 'DELETE' })
    await fetchAll()
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
    await adminFetch('/api/admin/chapters/reorder', { method: 'PATCH', body: { ids: orderedIds.value } })
    toast.success(t('admin.saveOrderSuccess'))
    await fetchAll()
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
      <h1 class="text-2xl font-bold font-heading">{{ t('admin.chaptersTitle') }}</h1>
      <div class="flex items-center gap-2">
        <UiButton
          :disabled="!hasOrderChanged || saveOrderLoading"
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

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div class="space-y-1.5 min-w-[160px]">
        <label class="text-sm font-medium">{{ t('admin.field.grade') }}</label>
        <Select v-model="gradeId">
          <SelectTrigger>
            <SelectValue :placeholder="t('admin.selectGrade')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{{ t('admin.selectGrade') }}</SelectItem>
            <SelectItem v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="space-y-1.5 min-w-[160px]">
        <label class="text-sm font-medium">{{ t('admin.field.subject') }}</label>
        <Select v-model="subjectId">
          <SelectTrigger>
            <SelectValue :placeholder="t('admin.selectSubject')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{{ t('admin.selectSubject') }}</SelectItem>
            <SelectItem v-for="s in filteredSubjects" :key="s.id" :value="s.id">{{ s.name }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
      <div v-if="!displayedChapters.length" class="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <VIcon name="bi-inbox" class="size-12 mx-auto mb-3 opacity-50" />
        <p>{{ t('admin.chaptersEmpty') }}</p>
      </div>
      <div v-else class="space-y-3">
        <UiCard
          v-for="(c, index) in displayedChapters"
          :key="c.id"
          class="transition-opacity"
          draggable="true"
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
            <img
              v-if="c.thumbnail_url"
              :src="c.thumbnail_url"
              :alt="c.title"
              class="size-12 rounded object-cover shrink-0"
            >
            <div v-else class="size-12 rounded bg-muted shrink-0 flex items-center justify-center">
              <VIcon name="bi-journal-bookmark" class="size-6 text-muted-foreground" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-muted-foreground truncate">{{ breadcrumb(c) }}</p>
              <p class="font-medium truncate">{{ c.title }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UiButton size="sm" variant="outline" @click.stop="openEdit(c)">{{ t('admin.modal.edit') }}</UiButton>
              <UiButton size="sm" variant="destructive" @click.stop="openDelete(c.id)">{{ t('admin.modal.delete') }}</UiButton>
            </div>
          </UiCardContent>
        </UiCard>
      </div>
    </template>

    <AdminChapterModal :open="modalOpen" :chapter="editingChapter" @close="modalOpen = false" @saved="fetchAll" />

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
