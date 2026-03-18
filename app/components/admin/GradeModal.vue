<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogFooter from '~/components/ui/dialog/DialogFooter.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiDialogDescription from '~/components/ui/dialog/DialogDescription.vue'
import UiButton from '~/components/ui/Button.vue'
import UiInput from '~/components/ui/Input.vue'
import UiLabel from '~/components/ui/Label.vue'

const props = defineProps<{
  open: boolean
  grade: { id: string; name: string; order: number } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()

const name = ref('')
const loading = ref(false)
const adminFetch = useAdminFetch()

watch(() => props.open, (val) => {
  if (val) {
    name.value = props.grade?.name ?? ''
  }
})

async function onSubmit() {
  if (!name.value.trim()) return
  loading.value = true
  try {
    if (props.grade) {
      await adminFetch(`/api/admin/grades/${props.grade.id}`, { method: 'PATCH', body: { name: name.value } })
    } else {
      await adminFetch('/api/admin/grades', { method: 'POST', body: { name: name.value, order: 0 } })
    }
    emit('saved')
    emit('close')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? t('common.error'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UiDialog :open="props.open" @update:open="(v: boolean) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle>{{ props.grade ? t('admin.modal.edit') : t('admin.modal.create') }} — {{ t('admin.grades') }}</UiDialogTitle>
          <UiDialogDescription class="sr-only">{{ t('admin.modal.gradeDescription') }}</UiDialogDescription>
        </UiDialogHeader>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <UiLabel for="grade-name">{{ t('admin.field.name') }}</UiLabel>
            <UiInput id="grade-name" v-model="name" required />
          </div>
          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="emit('close')">{{ t('admin.modal.cancel') }}</UiButton>
            <UiButton type="submit" :disabled="loading">{{ loading ? t('common.loading') : t('admin.modal.save') }}</UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
