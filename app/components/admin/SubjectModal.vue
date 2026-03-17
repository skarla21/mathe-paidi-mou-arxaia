<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogFooter from '~/components/ui/dialog/DialogFooter.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiButton from '~/components/ui/Button.vue'
import UiInput from '~/components/ui/Input.vue'
import UiLabel from '~/components/ui/Label.vue'

const props = defineProps<{
  open: boolean
  subject: { id: string; name: string; grade_id: string } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()

const name = ref('')
const gradeId = ref('')
const grades = ref<any[]>([])
const loading = ref(false)

watch(() => props.open, async (val) => {
  if (!val) return
  name.value = props.subject?.name ?? ''
  gradeId.value = props.subject?.grade_id ?? ''
  try { grades.value = await $fetch<{ id: string; name: string }[]>('/api/admin/grades') } catch { grades.value = [] }
})

async function onSubmit() {
  if (!name.value.trim() || !gradeId.value) return
  loading.value = true
  try {
    if (props.subject) {
      await $fetch(`/api/admin/subjects/${props.subject.id}`, { method: 'PATCH', body: { name: name.value, grade_id: gradeId.value } })
    } else {
      await $fetch('/api/admin/subjects', { method: 'POST', body: { name: name.value, grade_id: gradeId.value } })
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
          <UiDialogTitle>{{ props.subject ? t('admin.modal.edit') : t('admin.modal.create') }} — {{ t('admin.subjects') }}</UiDialogTitle>
        </UiDialogHeader>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <UiLabel for="subject-name">{{ t('admin.field.name') }}</UiLabel>
            <UiInput id="subject-name" v-model="name" required />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.grade') }}</UiLabel>
            <select v-model="gradeId" required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="" disabled>{{ t('admin.selectGrade') }}</option>
              <option v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
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
