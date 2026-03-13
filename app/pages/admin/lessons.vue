<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiBadge from '~/components/ui/Badge.vue'
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

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.lessonsTitle')}` }))

const lessons = ref<any[]>([])
const loading = ref(true)
const modalOpen = ref(false)
const editingLesson = ref<any>(null)
const deleteDialogOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleteLoading = ref(false)

async function fetchLessons() {
  loading.value = true
  try { lessons.value = await $fetch<any[]>('/api/admin/lessons') }
  catch { lessons.value = [] }
  finally { loading.value = false }
}

onMounted(fetchLessons)

function openCreate() { editingLesson.value = null; modalOpen.value = true }
function openEdit(l: any) { editingLesson.value = l; modalOpen.value = true }
function openDelete(id: string) { deletingId.value = id; deleteDialogOpen.value = true }

async function confirmDelete() {
  if (!deletingId.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/admin/lessons/${deletingId.value}`, { method: 'DELETE' })
    await fetchLessons()
    deleteDialogOpen.value = false
  } catch (e: any) {
    toast.error(e?.data?.message ?? t('common.error'))
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold font-heading">{{ t('admin.lessonsTitle') }}</h1>
      <UiButton @click="openCreate">+ {{ t('admin.modal.create') }}</UiButton>
    </div>
    <p v-if="loading" class="text-muted-foreground">{{ t('common.loading') }}</p>
    <div v-else class="rounded-md border overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.title') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.assignedTo') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.isFree') }}</th>
            <th class="px-4 py-3 text-center font-medium">PDF</th>
            <th class="px-4 py-3 text-right font-medium"/>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in lessons" :key="l.id" class="border-b last:border-0 hover:bg-muted/30">
            <td class="px-4 py-3 font-medium">{{ l.title }}</td>
            <td class="px-4 py-3 text-muted-foreground">{{ l.courses?.title ?? l.lesson_categories?.name ?? '—' }}</td>
            <td class="px-4 py-3">
              <UiBadge :variant="l.is_free ? 'secondary' : 'default'">{{ l.is_free ? t('admin.field.isFree') : t('admin.paid') }}</UiBadge>
            </td>
            <td class="px-4 py-3 text-center">{{ l.pdf_url ? '✓' : '✗' }}</td>
            <td class="px-4 py-3 text-right space-x-2">
              <UiButton size="sm" variant="outline" @click="openEdit(l)">{{ t('admin.modal.edit') }}</UiButton>
              <UiButton size="sm" variant="destructive" @click="openDelete(l.id)">{{ t('admin.modal.delete') }}</UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
