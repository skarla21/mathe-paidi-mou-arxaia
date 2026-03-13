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
import AdminCourseModal from '~/components/admin/CourseModal.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.coursesTitle')}` }))

const courses = ref<any[]>([])
const loading = ref(true)
const modalOpen = ref(false)
const editingCourse = ref<any>(null)
const deleteDialogOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleteLoading = ref(false)

async function fetchCourses() {
  loading.value = true
  try { courses.value = await $fetch<any[]>('/api/admin/courses') }
  catch { courses.value = [] }
  finally { loading.value = false }
}

onMounted(fetchCourses)

function openCreate() { editingCourse.value = null; modalOpen.value = true }
function openEdit(c: any) { editingCourse.value = c; modalOpen.value = true }
function openDelete(id: string) { deletingId.value = id; deleteDialogOpen.value = true }

async function confirmDelete() {
  if (!deletingId.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/admin/courses/${deletingId.value}`, { method: 'DELETE' })
    await fetchCourses()
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
      <h1 class="text-2xl font-bold font-heading">{{ t('admin.coursesTitle') }}</h1>
      <UiButton @click="openCreate">+ {{ t('admin.modal.create') }}</UiButton>
    </div>
    <p v-if="loading" class="text-muted-foreground">{{ t('common.loading') }}</p>
    <div v-else class="rounded-md border overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium w-12"/>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.title') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.subject') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.isFree') }}</th>
            <th class="px-4 py-3 text-right font-medium"/>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in courses" :key="c.id" class="border-b last:border-0 hover:bg-muted/30">
            <td class="px-4 py-3">
              <img v-if="c.thumbnail_url" :src="c.thumbnail_url" class="size-8 rounded object-cover" alt="" >
              <span v-else class="text-muted-foreground">—</span>
            </td>
            <td class="px-4 py-3 font-medium">{{ c.title }}</td>
            <td class="px-4 py-3 text-muted-foreground">{{ c.subjects?.name ?? '—' }}</td>
            <td class="px-4 py-3">
              <UiBadge :variant="c.is_free ? 'secondary' : 'default'">{{ c.is_free ? t('admin.field.isFree') : `€${c.price}` }}</UiBadge>
            </td>
            <td class="px-4 py-3 text-right space-x-2">
              <UiButton size="sm" variant="outline" @click="openEdit(c)">{{ t('admin.modal.edit') }}</UiButton>
              <UiButton size="sm" variant="destructive" @click="openDelete(c.id)">{{ t('admin.modal.delete') }}</UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminCourseModal :open="modalOpen" :course="editingCourse" @close="modalOpen = false" @saved="fetchCourses" />

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
