<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
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

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.gradesTitle')}` }))

const grades = ref<any[]>([])
const loading = ref(true)
const modalOpen = ref(false)
const editingGrade = ref<any>(null)
const deleteDialogOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleteLoading = ref(false)

async function fetchGrades() {
  loading.value = true
  try { grades.value = await $fetch<any[]>('/api/admin/grades') }
  catch {
    grades.value = []
    toast.error(t('common.error'))
  }
  finally { loading.value = false }
}

onMounted(fetchGrades)

function openCreate() { editingGrade.value = null; modalOpen.value = true }
function openEdit(g: any) { editingGrade.value = g; modalOpen.value = true }
function openDelete(id: string) { deletingId.value = id; deleteDialogOpen.value = true }

async function confirmDelete() {
  if (!deletingId.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/admin/grades/${deletingId.value}`, { method: 'DELETE' })
    await fetchGrades()
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
      <h1 class="text-2xl font-bold font-heading">{{ t('admin.gradesTitle') }}</h1>
      <UiButton @click="openCreate">+ {{ t('admin.modal.create') }}</UiButton>
    </div>
    <p v-if="loading" class="text-muted-foreground">{{ t('common.loading') }}</p>
    <p v-else-if="!grades.length" class="text-muted-foreground">{{ t('admin.gradesEmpty') }}</p>
    <div v-else class="rounded-md border">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.name') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.order') }}</th>
            <th class="px-4 py-3 text-right font-medium"/>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in grades" :key="g.id" class="border-b last:border-0 hover:bg-muted/30">
            <td class="px-4 py-3">{{ g.name }}</td>
            <td class="px-4 py-3">{{ g.order }}</td>
            <td class="px-4 py-3 text-right space-x-2">
              <UiButton size="sm" variant="outline" @click="openEdit(g)">{{ t('admin.modal.edit') }}</UiButton>
              <UiButton size="sm" variant="destructive" @click="openDelete(g.id)">{{ t('admin.modal.delete') }}</UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
