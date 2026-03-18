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
import UiTextarea from '~/components/ui/Textarea.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const props = defineProps<{
  open: boolean
  chapter: {
    id: string; title: string; description: string | null
    subject_id: string; thumbnail_url: string | null
  } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const adminFetch = useAdminFetch()

const title = ref('')
const description = ref('')
const subjectId = ref('')
const thumbnailUrl = ref('')
const subjects = ref<{ id: string; name: string }[]>([])
const loading = ref(false)

watch(() => props.open, async (val) => {
  if (!val) return
  title.value = props.chapter?.title ?? ''
  description.value = props.chapter?.description ?? ''
  subjectId.value = props.chapter?.subject_id ?? ''
  thumbnailUrl.value = props.chapter?.thumbnail_url ?? ''
  try { subjects.value = await adminFetch<{ id: string; name: string }[]>('/api/admin/subjects') } catch { subjects.value = [] }
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
      await adminFetch(`/api/admin/chapters/${props.chapter.id}`, { method: 'PATCH', body })
    } else {
      await adminFetch('/api/admin/chapters', { method: 'POST', body })
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
      <UiDialogContent class="max-w-lg max-h-[90vh] overflow-y-auto">
        <UiDialogHeader>
          <UiDialogTitle>{{ props.chapter ? t('admin.modal.edit') : t('admin.modal.create') }} — {{ t('admin.chapters') }}</UiDialogTitle>
          <UiDialogDescription class="sr-only">{{ t('admin.modal.chapterDescription') }}</UiDialogDescription>
        </UiDialogHeader>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.title') }}</UiLabel>
            <UiInput v-model="title" required />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.description') }}</UiLabel>
            <UiTextarea v-model="description" :rows="3" />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.subject') }}</UiLabel>
            <Select v-model="subjectId">
              <SelectTrigger>
                <SelectValue :placeholder="t('admin.selectSubject')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.thumbnailUrl') }}</UiLabel>
            <UiInput v-model="thumbnailUrl" :placeholder="t('admin.placeholder.url')" />
            <div v-if="thumbnailUrl" class="mt-2">
              <img :src="thumbnailUrl" alt="" class="h-16 w-16 rounded-md object-cover border border-border" >
            </div>
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
