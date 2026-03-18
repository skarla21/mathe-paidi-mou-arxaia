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
import UiProgress from '~/components/ui/Progress.vue'
import { Checkbox } from '~/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const props = defineProps<{
  open: boolean
  lesson: {
    id: string; title: string; content: string | null; is_free: boolean
    content_url: string | null; order: number; price: number
    chapter_id: string | null; subject_id: string | null; category_id: string | null
  } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const adminFetch = useAdminFetch()

const title = ref('')
const content = ref('')
const isFree = ref(true)
const price = ref(0)
const contentUrl = ref('')
const assignment = ref<'chapter' | 'subject' | 'category'>('chapter')
const gradeId = ref('')
const chapterId = ref('')
const subjectId = ref('')
const categoryId = ref('')
const grades = ref<{ id: string; name: string }[]>([])
const chapters = ref<{ id: string; title: string; subject_id: string; grade_id: string; subjects?: { name: string; grades?: { name: string } } }[]>([])
const subjects = ref<{ id: string; name: string; grade_id: string; grades?: { name: string } }[]>([])
const categories = ref<{ id: string; name: string }[]>([])
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const dragActive = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const filteredSubjects = computed(() =>
  gradeId.value ? subjects.value.filter(s => s.grade_id === gradeId.value) : []
)
const filteredChapters = computed(() =>
  subjectId.value ? chapters.value.filter(c => c.subject_id === subjectId.value) : []
)

const initializing = ref(false)

watch(() => props.open, async (val) => {
  if (!val) return
  initializing.value = true
  title.value = props.lesson?.title ?? ''
  content.value = props.lesson?.content ?? ''
  isFree.value = props.lesson?.is_free ?? true
  price.value = props.lesson?.price ?? 0
  contentUrl.value = props.lesson?.content_url ?? ''
  assignment.value = props.lesson?.chapter_id
    ? 'chapter'
    : props.lesson?.subject_id
      ? 'subject'
      : 'category'
  gradeId.value = ''
  subjectId.value = ''
  chapterId.value = ''
  categoryId.value = ''

  try {
    const [gr, ch, sub, cat] = await Promise.all([
      adminFetch<{ id: string; name: string }[]>('/api/admin/grades'),
      adminFetch<{ id: string; title: string; subject_id: string; grade_id: string; subjects?: { name: string; grades?: { name: string } } }[]>('/api/admin/chapters'),
      adminFetch<{ id: string; name: string; grade_id: string; grades?: { name: string } }[]>('/api/admin/subjects'),
      adminFetch<{ id: string; name: string }[]>('/api/admin/categories'),
    ])
    grades.value = gr
    chapters.value = ch
    subjects.value = sub
    categories.value = cat

    if (props.lesson?.chapter_id) {
      const chFound = chapters.value.find(c => c.id === props.lesson!.chapter_id)
      if (chFound) {
        gradeId.value = chFound.grade_id
        subjectId.value = chFound.subject_id
        chapterId.value = chFound.id
      }
    } else if (props.lesson?.subject_id) {
      const s = subjects.value.find(s => s.id === props.lesson!.subject_id)
      if (s) {
        gradeId.value = s.grade_id
        subjectId.value = s.id
      }
    }
    categoryId.value = props.lesson?.category_id ?? ''
  } catch {
    toast.error(t('common.error'))
  } finally {
    nextTick(() => { initializing.value = false })
  }
})

watch(gradeId, () => {
  if (initializing.value) return
  subjectId.value = ''
  chapterId.value = ''
})
watch(subjectId, () => {
  if (initializing.value) return
  chapterId.value = ''
})

const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png'] as const
const MAX_PDF_BYTES = 50 * 1024 * 1024
const MAX_IMAGE_BYTES = 20 * 1024 * 1024

async function uploadFile(file: File) {
  if (uploading.value) return
  if (!ALLOWED_MIMES.includes(file.type as (typeof ALLOWED_MIMES)[number])) {
    toast.error(t('admin.uploads.fileTypeError'))
    return
  }
  const maxSize = file.type === 'application/pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES
  if (file.size > maxSize) {
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
    const res = await adminFetch<{ url: string }>('/api/admin/upload', { method: 'POST', body: formData })
    contentUrl.value = res.url
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
  if (input.files?.[0]) uploadFile(input.files[0])
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragActive.value = false
  if (e.dataTransfer?.files?.[0]) uploadFile(e.dataTransfer.files[0])
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragActive.value = true
}

function onDragLeave() {
  dragActive.value = false
}

function clearContent() {
  contentUrl.value = ''
}

async function onSubmit() {
  loading.value = true
  try {
    const body = {
      title: title.value,
      content: content.value || null,
      is_free: isFree.value,
      price: isFree.value ? 0 : price.value,
      content_url: contentUrl.value || null,
      order: 0,
      chapter_id: assignment.value === 'chapter' ? chapterId.value || null : null,
      subject_id: assignment.value === 'subject' ? subjectId.value || null : null,
      category_id: assignment.value === 'category' ? categoryId.value || null : null,
    }
    if (props.lesson) {
      await adminFetch(`/api/admin/lessons/${props.lesson.id}`, { method: 'PATCH', body })
    } else {
      await adminFetch('/api/admin/lessons', { method: 'POST', body })
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
      <UiDialogContent class="max-w-xl max-h-[90vh] overflow-y-auto">
        <UiDialogHeader>
          <UiDialogTitle>{{ props.lesson ? t('admin.modal.edit') : t('admin.modal.create') }} — {{ t('admin.lessons') }}</UiDialogTitle>
          <UiDialogDescription class="sr-only">{{ t('admin.modal.lessonDescription') }}</UiDialogDescription>
        </UiDialogHeader>
        <form class="space-y-6" @submit.prevent="onSubmit">

          <!-- Basic Info -->
          <fieldset class="space-y-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ t('admin.sectionContent') }}</p>
            <div class="space-y-1.5">
              <UiLabel>{{ t('admin.field.title') }}</UiLabel>
              <UiInput v-model="title" required />
            </div>
            <div class="space-y-1.5">
              <UiLabel>{{ t('admin.field.content') }}</UiLabel>
              <UiTextarea v-model="content" :rows="3" />
            </div>
            <div class="space-y-1.5">
              <UiLabel>{{ t('admin.field.contentFile') }}</UiLabel>
              <div
                class="rounded-lg border-2 border-dashed p-4 text-center transition-colors"
                :class="dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
                @drop="onDrop"
                @dragover="onDragOver"
                @dragleave="onDragLeave"
              >
                <div class="flex flex-col items-center gap-2">
                  <VIcon name="bi-cloud-arrow-up" class="size-8 text-muted-foreground" />
                  <p class="text-sm font-medium">{{ t('admin.uploads.dragDrop') }}</p>
                  <p class="text-xs text-muted-foreground">{{ t('admin.uploads.maxSize') }}</p>
                  <UiButton
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="uploading"
                    @click="fileInput?.click()"
                  >
                    {{ t('admin.uploads.selectFile') }}
                  </UiButton>
                  <input
                    ref="fileInput"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    class="hidden"
                    @change="onFileSelect"
                  >
                </div>
                <UiProgress v-if="uploading" :model-value="uploadProgress" class="mt-3 h-2" />
                <div v-else-if="contentUrl" class="mt-3 flex items-center justify-center gap-2">
                  <span class="truncate text-xs text-muted-foreground max-w-[200px]">{{ contentUrl }}</span>
                  <UiButton type="button" variant="ghost" size="sm" @click="clearContent">
                    {{ t('admin.lessonModal.removeFile') }}
                  </UiButton>
                </div>
                <p v-else class="mt-2 text-xs text-muted-foreground">{{ t('admin.lessonModal.noFile') }}</p>
              </div>
              <p class="text-xs text-muted-foreground">{{ t('admin.lessonModal.orPasteUrl') }}</p>
              <UiInput v-model="contentUrl" :placeholder="t('admin.placeholder.url')" />
            </div>
          </fieldset>

          <!-- Pricing -->
          <fieldset class="space-y-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ t('admin.field.price') }}</p>
            <div class="flex items-center gap-2">
              <Checkbox id="lesson-free" v-model:checked="isFree" />
              <UiLabel for="lesson-free">{{ t('admin.field.isFree') }}</UiLabel>
            </div>
            <div class="space-y-1.5">
              <UiLabel>{{ t('admin.field.price') }}</UiLabel>
              <UiInput
                v-model.number="price"
                type="number"
                min="0"
                step="0.1"
                :disabled="isFree"
              />
            </div>
          </fieldset>

          <!-- Assignment -->
          <fieldset class="space-y-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ t('admin.field.assignedTo') }}</p>
            <RadioGroup v-model="assignment" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <RadioGroupItem id="assign-chapter" value="chapter" />
                <UiLabel for="assign-chapter">{{ t('admin.assignChapter') }}</UiLabel>
              </div>
              <div class="flex items-center gap-2">
                <RadioGroupItem id="assign-subject" value="subject" />
                <UiLabel for="assign-subject">{{ t('admin.assignSubject') }}</UiLabel>
              </div>
              <div class="flex items-center gap-2">
                <RadioGroupItem id="assign-category" value="category" />
                <UiLabel for="assign-category">{{ t('admin.assignCategory') }}</UiLabel>
              </div>
            </RadioGroup>
            <template v-if="assignment === 'chapter'">
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
              <div v-if="gradeId" class="space-y-1.5">
                <UiLabel>{{ t('admin.field.subject') }}</UiLabel>
                <Select v-model="subjectId">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.selectSubject')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="s in filteredSubjects" :key="s.id" :value="s.id">{{ s.name }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div v-if="subjectId" class="space-y-1.5">
                <UiLabel>{{ t('admin.field.chapter') }}</UiLabel>
                <Select v-model="chapterId">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.selectChapter')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="c in filteredChapters" :key="c.id" :value="c.id">{{ c.title }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </template>
            <template v-else-if="assignment === 'subject'">
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
              <div v-if="gradeId" class="space-y-1.5">
                <UiLabel>{{ t('admin.field.subject') }}</UiLabel>
                <Select v-model="subjectId">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.selectSubject')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="s in filteredSubjects" :key="s.id" :value="s.id">{{ s.name }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </template>
            <div v-if="assignment === 'category'" class="space-y-1.5">
              <UiLabel>{{ t('admin.field.category') }}</UiLabel>
              <Select v-model="categoryId">
                <SelectTrigger>
                  <SelectValue :placeholder="t('admin.selectCategory')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </fieldset>

          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="emit('close')">{{ t('admin.modal.cancel') }}</UiButton>
            <UiButton type="submit" :disabled="loading">{{ loading ? t('common.loading') : t('admin.modal.save') }}</UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
