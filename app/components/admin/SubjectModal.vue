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
import UiProgress from '~/components/ui/Progress.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const props = defineProps<{
  open: boolean
  subject: { id: string; name: string; grade_id: string; image_url?: string | null } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const adminFetch = useAdminFetch()

const name = ref('')
const gradeId = ref('')
const imageUrl = ref('')
const grades = ref<{ id: string; name: string }[]>([])
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const dragActive = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png'] as const
const MAX_IMAGE_BYTES = 20 * 1024 * 1024

watch(() => props.open, async (val) => {
  if (!val) return
  name.value = props.subject?.name ?? ''
  gradeId.value = props.subject?.grade_id ?? ''
  imageUrl.value = props.subject?.image_url ?? ''
  try { grades.value = await $fetch<{ id: string; name: string }[]>('/api/admin/grades') } catch { grades.value = [] }
})

async function uploadImage(file: File) {
  if (uploading.value) return
  if (!ALLOWED_IMAGE_MIMES.includes(file.type as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    toast.error(t('admin.uploads.fileTypeError'))
    return
  }
  if (file.size > MAX_IMAGE_BYTES) {
    toast.error(t('admin.uploads.tooLarge'))
    return
  }
  uploading.value = true
  uploadProgress.value = 0
  const interval = setInterval(() => {
    if (uploadProgress.value < 90) uploadProgress.value += 10
  }, 200)
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('target', 'image')
    formData.append('entity', 'subject')
    const res = await adminFetch<{ url: string }>('/api/admin/upload', { method: 'POST', body: formData })
    imageUrl.value = res.url
    uploadProgress.value = 100
    toast.success(t('admin.uploads.uploadSuccess'))
  } catch {
    toast.error(t('admin.uploads.uploadError'))
  } finally {
    clearInterval(interval)
    uploading.value = false
    uploadProgress.value = 0
  }
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) uploadImage(input.files[0])
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragActive.value = false
  if (e.dataTransfer?.files?.[0]) uploadImage(e.dataTransfer.files[0])
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragActive.value = true
}

function onDragLeave() {
  dragActive.value = false
}

async function onSubmit() {
  if (!name.value.trim() || !gradeId.value) return
  loading.value = true
  try {
    const body = { name: name.value, grade_id: gradeId.value, image_url: imageUrl.value || null }
    if (props.subject) {
      await adminFetch(`/api/admin/subjects/${props.subject.id}`, { method: 'PATCH', body })
    } else {
      await adminFetch('/api/admin/subjects', { method: 'POST', body: { ...body, order: 0 } })
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
      <UiDialogContent class="max-w-lg">
        <UiDialogHeader>
          <UiDialogTitle>{{ props.subject ? t('admin.modal.edit') : t('admin.modal.create') }} — {{ t('admin.subjects') }}</UiDialogTitle>
          <UiDialogDescription class="sr-only">{{ t('admin.modal.subjectDescription') }}</UiDialogDescription>
        </UiDialogHeader>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <UiLabel for="subject-name">{{ t('admin.field.name') }}</UiLabel>
            <UiInput id="subject-name" v-model="name" required />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.grade') }}</UiLabel>
            <Select v-model="gradeId">
              <SelectTrigger>
                <SelectValue :placeholder="t('admin.selectGrade')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.imageUrl') }}</UiLabel>
            <div
              class="rounded-lg border-2 border-dashed p-4 text-center transition-colors"
              :class="dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
              @drop="onDrop"
              @dragover="onDragOver"
              @dragleave="onDragLeave"
            >
              <div class="flex flex-col items-center gap-2">
                <VIcon name="bi-cloud-arrow-up" class="size-8 text-muted-foreground" />
                <p class="text-sm font-medium">{{ t('admin.uploads.dragDropImage') }}</p>
                <p class="text-xs text-muted-foreground">{{ t('admin.uploads.maxSizeImage') }}</p>
                <UiButton type="button" variant="outline" size="sm" :disabled="uploading" @click="fileInput?.click()">
                  {{ t('admin.uploads.selectFile') }}
                </UiButton>
                <input ref="fileInput" type="file" accept="image/jpeg,image/png" class="hidden" @change="onFileSelect">
              </div>
              <UiProgress v-if="uploading" :model-value="uploadProgress" class="mt-3 h-2" />
              <div v-else-if="imageUrl" class="mt-3 flex items-center justify-center gap-2">
                <img :src="imageUrl" alt="" class="h-16 w-16 rounded-md object-cover border border-border">
                <UiButton type="button" variant="ghost" size="sm" @click="imageUrl = ''">
                  {{ t('admin.lessonModal.removeFile') }}
                </UiButton>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">{{ t('admin.lessonModal.orPasteUrl') }}</p>
            <UiInput v-model="imageUrl" :placeholder="t('admin.placeholder.url')" />
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
