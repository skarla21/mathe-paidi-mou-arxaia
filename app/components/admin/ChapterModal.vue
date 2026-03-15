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
  chapter: {
    id: string; title: string; description: string | null
    subject_id: string; thumbnail_url: string | null
  } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()

const title = ref('')
const description = ref('')
const subjectId = ref('')
const thumbnailUrl = ref('')
const subjects = ref<any[]>([])
const loading = ref(false)

watch(() => props.open, async (val) => {
  if (!val) return
  title.value = props.chapter?.title ?? ''
  description.value = props.chapter?.description ?? ''
  subjectId.value = props.chapter?.subject_id ?? ''
  thumbnailUrl.value = props.chapter?.thumbnail_url ?? ''
  try { subjects.value = await $fetch<{ id: string; name: string }[]>('/api/admin/subjects') } catch { subjects.value = [] }
})

async function onSubmit() {
  if (!title.value.trim() || !subjectId.value) return
  loading.value = true
  try {
    const body = {
      title: title.value, description: description.value || null,
      subject_id: subjectId.value,
      thumbnail_url: thumbnailUrl.value || null,
    }
    if (props.chapter) {
      await $fetch(`/api/admin/chapters/${props.chapter.id}`, { method: 'PATCH', body })
    } else {
      await $fetch('/api/admin/chapters', { method: 'POST', body })
    }
    emit('saved')
    emit('close')
  } catch (e: any) {
    toast.error(e?.data?.message ?? t('common.error'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UiDialog :open="props.open" @update:open="(v: boolean) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent class="max-w-lg max-h-[90vh] overflow-y-auto">
        <UiDialogHeader>
          <UiDialogTitle>{{ props.chapter ? t('admin.modal.edit') : t('admin.modal.create') }} — {{ t('admin.chapters') }}</UiDialogTitle>
        </UiDialogHeader>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.title') }}</UiLabel>
            <UiInput v-model="title" required />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.description') }}</UiLabel>
            <textarea v-model="description" rows="3" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.subject') }}</UiLabel>
            <select v-model="subjectId" required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="" disabled>Select subject…</option>
              <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.thumbnailUrl') }}</UiLabel>
            <UiInput v-model="thumbnailUrl" placeholder="https://..." />
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
