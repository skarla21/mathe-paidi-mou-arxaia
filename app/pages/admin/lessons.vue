<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiBadge from '~/components/ui/Badge.vue'
import UiInput from '~/components/ui/Input.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
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
import AdminLessonModal from '~/components/admin/LessonModal.vue'
import type { Lesson } from '~/types/database'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.lessonsTitle')}` }))

const lessons = ref<Lesson[]>([])
const loading = ref(true)
const search = ref('')
const modalOpen = ref(false)
const editingLesson = ref<Lesson | null>(null)
const deleteDialogOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleteLoading = ref(false)

const filteredLessons = computed(() => {
  if (!search.value) return lessons.value
  const q = search.value.toLowerCase()
  return lessons.value.filter(l => l.title.toLowerCase().includes(q))
})

function assignmentLabel(l: Lesson): string {
  if (l.chapters?.title) return l.chapters.title
  if (l.subjects?.name) return l.subjects.name
  if (l.categories?.name) return l.categories.name
  return t('common.empty')
}

function assignmentVariant(l: Lesson): 'default' | 'secondary' | 'outline' {
  if (l.chapter_id) return 'default'
  if (l.subject_id) return 'secondary'
  return 'outline'
}

async function fetchLessons() {
  loading.value = true
  try { lessons.value = await $fetch<Lesson[]>('/api/admin/lessons') }
  catch {
    lessons.value = []
    toast.error(t('common.error'))
  }
  finally { loading.value = false }
}

onMounted(fetchLessons)

function openCreate() { editingLesson.value = null; modalOpen.value = true }
function openEdit(l: Lesson) { editingLesson.value = l; modalOpen.value = true }
function openDelete(id: string) { deletingId.value = id; deleteDialogOpen.value = true }

async function confirmDelete() {
  if (!deletingId.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/admin/lessons/${deletingId.value}`, { method: 'DELETE' })
    await fetchLessons()
    deleteDialogOpen.value = false
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? t('common.error'))
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold font-heading">{{ t('admin.lessonsTitle') }}</h1>
      <UiButton @click="openCreate">
        <VIcon name="bi-plus-circle" class="mr-2 size-4" />
        {{ t('admin.modal.create') }}
      </UiButton>
    </div>

    <!-- Search -->
    <div class="relative mb-4">
      <VIcon name="bi-search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <UiInput v-model="search" :placeholder="t('admin.search')" class="pl-9" />
    </div>

    <!-- Skeleton loading -->
    <template v-if="loading">
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead v-for="i in 5" :key="i"><UiSkeleton class="h-4 w-20" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="i in 5" :key="i">
              <TableCell v-for="j in 5" :key="j"><UiSkeleton class="h-4 w-full" /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>

    <!-- Data table -->
    <template v-else>
      <div class="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('admin.field.title') }}</TableHead>
              <TableHead>{{ t('admin.field.assignedTo') }}</TableHead>
              <TableHead>{{ t('admin.field.isFree') }}</TableHead>
              <TableHead class="text-center">{{ t('admin.field.pdf') }}</TableHead>
              <TableHead class="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- Empty state -->
            <TableRow v-if="!filteredLessons.length">
              <TableCell :colspan="5" class="h-32 text-center">
                <div class="flex flex-col items-center gap-2 text-muted-foreground">
                  <VIcon name="bi-inbox" class="size-8" />
                  <p>{{ t('admin.lessonsEmpty') }}</p>
                </div>
              </TableCell>
            </TableRow>
            <!-- Rows -->
            <TableRow v-for="l in filteredLessons" v-else :key="l.id">
              <TableCell class="font-medium">{{ l.title }}</TableCell>
              <TableCell>
                <UiBadge :variant="assignmentVariant(l)">{{ assignmentLabel(l) }}</UiBadge>
              </TableCell>
              <TableCell>
                <UiBadge :variant="l.is_free ? 'secondary' : 'default'">
                  {{ l.is_free ? t('admin.field.isFree') : t('admin.paid') }}
                </UiBadge>
              </TableCell>
              <TableCell class="text-center text-muted-foreground">
                {{ l.pdf_url ? t('admin.field.yes') : t('admin.field.no') }}
              </TableCell>
              <TableCell class="text-right space-x-2">
                <UiButton size="sm" variant="outline" @click="openEdit(l)">{{ t('admin.modal.edit') }}</UiButton>
                <UiButton size="sm" variant="destructive" @click="openDelete(l.id)">{{ t('admin.modal.delete') }}</UiButton>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>

    <AdminLessonModal :open="modalOpen" :lesson="editingLesson" @close="modalOpen = false" @saved="fetchLessons" />

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
