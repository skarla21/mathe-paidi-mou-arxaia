<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
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
import AdminChapterModal from '~/components/admin/ChapterModal.vue'
import type { Chapter } from '~/types/database'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.chaptersTitle')}` }))

const chapters = ref<Chapter[]>([])
const loading = ref(true)
const search = ref('')
const modalOpen = ref(false)
const editingChapter = ref<Chapter | null>(null)
const deleteDialogOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleteLoading = ref(false)

const filteredChapters = computed(() => {
  if (!search.value) return chapters.value
  const q = search.value.toLowerCase()
  return chapters.value.filter(c => c.title.toLowerCase().includes(q))
})

async function fetchChapters() {
  loading.value = true
  try { chapters.value = await $fetch<Chapter[]>('/api/admin/chapters') }
  catch {
    chapters.value = []
    toast.error(t('common.error'))
  }
  finally { loading.value = false }
}

onMounted(fetchChapters)

function openCreate() { editingChapter.value = null; modalOpen.value = true }
function openEdit(c: Chapter) { editingChapter.value = c; modalOpen.value = true }
function openDelete(id: string) { deletingId.value = id; deleteDialogOpen.value = true }

async function confirmDelete() {
  if (!deletingId.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/admin/chapters/${deletingId.value}`, { method: 'DELETE' })
    await fetchChapters()
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
      <h1 class="text-2xl font-bold font-heading">{{ t('admin.chaptersTitle') }}</h1>
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
              <TableHead v-for="i in 4" :key="i"><UiSkeleton class="h-4 w-20" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="i in 5" :key="i">
              <TableCell v-for="j in 4" :key="j"><UiSkeleton class="h-4 w-full" /></TableCell>
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
              <TableHead class="w-12" />
              <TableHead>{{ t('admin.field.title') }}</TableHead>
              <TableHead>{{ t('admin.field.subject') }}</TableHead>
              <TableHead class="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- Empty state -->
            <TableRow v-if="!filteredChapters.length">
              <TableCell :colspan="4" class="h-32 text-center">
                <div class="flex flex-col items-center gap-2 text-muted-foreground">
                  <VIcon name="bi-inbox" class="size-8" />
                  <p>{{ t('admin.chaptersEmpty') }}</p>
                </div>
              </TableCell>
            </TableRow>
            <!-- Rows -->
            <TableRow v-for="c in filteredChapters" v-else :key="c.id">
              <TableCell>
                <img
                  v-if="c.thumbnail_url"
                  :src="c.thumbnail_url"
                  :alt="c.title"
                  class="size-8 rounded object-cover"
                >
                <span v-else class="text-muted-foreground">{{ t('common.empty') }}</span>
              </TableCell>
              <TableCell class="font-medium">{{ c.title }}</TableCell>
              <TableCell class="text-muted-foreground">{{ c.subjects?.name ?? t('common.empty') }}</TableCell>
              <TableCell class="text-right space-x-2">
                <UiButton size="sm" variant="outline" @click="openEdit(c)">{{ t('admin.modal.edit') }}</UiButton>
                <UiButton size="sm" variant="destructive" @click="openDelete(c.id)">{{ t('admin.modal.delete') }}</UiButton>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>

    <AdminChapterModal :open="modalOpen" :chapter="editingChapter" @close="modalOpen = false" @saved="fetchChapters" />

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
