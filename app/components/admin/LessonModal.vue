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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

interface PlacementRow {
  key: number
  type: 'subject' | 'chapter' | 'category'
  gradeId: string
  subjectId: string
  chapterId: string
  categoryId: string
}

const props = defineProps<{
  open: boolean
  lesson: {
    id: string
    title: string
    content: string | null
    is_free: boolean
    content_url: string | null
    price: number
    placements?: Array<{
      id: string
      subject_id: string | null
      chapter_id: string | null
      category_id: string | null
      subjects?: { name: string; grade_id?: string } | null
      chapters?: { title: string; grade_id?: string; subject_id?: string } | null
      categories?: { name: string } | null
    }>
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
const fileName = ref('')

let placementKey = 0
const placements = ref<PlacementRow[]>([])

const grades = ref<{ id: string; name: string }[]>([])
const chapters = ref<{ id: string; title: string; subject_id: string; grade_id: string }[]>([])
const subjects = ref<{ id: string; name: string; grade_id: string }[]>([])
const categories = ref<{ id: string; name: string }[]>([])
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const dragActive = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function fileLabelFromUrl(url: string): string {
  try {
    const segment = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '')
    const name = segment.replace(/^\d{10,}-/, '') || segment
    const stem = name.replace(/\.[^.]+$/, '')
    // Older uploads replaced Greek (and any non-ASCII) with underscores.
    if (!/[\p{L}\p{N}]/u.test(stem)) return ''
    return name
  } catch {
    return ''
  }
}

function subjectsForGrade(gradeId: string) {
  return subjects.value.filter(s => s.grade_id === gradeId)
}

function chaptersForSubject(subjectId: string) {
  return chapters.value.filter(c => c.subject_id === subjectId)
}

function addPlacement() {
  placements.value.push({
    key: placementKey++,
    type: 'chapter',
    gradeId: '',
    subjectId: '',
    chapterId: '',
    categoryId: '',
  })
}

function removePlacement(key: number) {
  if (placements.value.length <= 1) return
  placements.value = placements.value.filter(p => p.key !== key)
}

function onPlacementTypeChange(row: PlacementRow, newType: 'subject' | 'chapter' | 'category') {
  row.type = newType
  row.gradeId = ''
  row.subjectId = ''
  row.chapterId = ''
  row.categoryId = ''
}

function onPlacementGradeChange(row: PlacementRow, newGradeId: string) {
  row.gradeId = newGradeId
  row.subjectId = ''
  row.chapterId = ''
}

function onPlacementSubjectChange(row: PlacementRow, newSubjectId: string) {
  row.subjectId = newSubjectId
  row.chapterId = ''
}

watch(() => props.open, async (val) => {
  if (!val) return

  title.value = props.lesson?.title ?? ''
  content.value = props.lesson?.content ?? ''
  isFree.value = props.lesson?.is_free ?? true
  price.value = props.lesson?.price ?? 0
  contentUrl.value = props.lesson?.content_url ?? ''
  fileName.value = contentUrl.value ? fileLabelFromUrl(contentUrl.value) : ''
  placements.value = []

  try {
    const [gr, ch, sub, cat] = await Promise.all([
      adminFetch<{ id: string; name: string }[]>('/api/admin/grades'),
      adminFetch<{ id: string; title: string; subject_id: string; grade_id: string }[]>('/api/admin/chapters'),
      adminFetch<{ id: string; name: string; grade_id: string }[]>('/api/admin/subjects'),
      adminFetch<{ id: string; name: string }[]>('/api/admin/categories'),
    ])
    grades.value = gr
    chapters.value = ch
    subjects.value = sub
    categories.value = cat

    if (props.lesson?.placements && props.lesson.placements.length > 0) {
      placements.value = props.lesson.placements.map(p => {
        const row: PlacementRow = {
          key: placementKey++,
          type: p.chapter_id ? 'chapter' : p.subject_id ? 'subject' : 'category',
          gradeId: '',
          subjectId: '',
          chapterId: '',
          categoryId: '',
        }
        if (p.subject_id) {
          const subFound = subjects.value.find(s => s.id === p.subject_id)
          if (subFound) {
            row.gradeId = subFound.grade_id
            row.subjectId = subFound.id
          }
        } else if (p.chapter_id) {
          const chFound = chapters.value.find(c => c.id === p.chapter_id)
          if (chFound) {
            row.gradeId = chFound.grade_id
            row.subjectId = chFound.subject_id
            row.chapterId = chFound.id
          }
        } else if (p.category_id) {
          row.categoryId = p.category_id
        }
        return row
      })
    } else {
      placements.value = [{
        key: placementKey++,
        type: 'chapter',
        gradeId: '',
        subjectId: '',
        chapterId: '',
        categoryId: '',
      }]
    }
  } catch {
    toast.error(t('common.error'))
  }
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
    fileName.value = file.name
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
  fileName.value = ''
}

async function onSubmit() {
  const placementPayload = placements.value
    .map(p => ({
      subject_id: p.type === 'subject' ? p.subjectId || null : null,
      chapter_id: p.type === 'chapter' ? p.chapterId || null : null,
      category_id: p.type === 'category' ? p.categoryId || null : null,
    }))
    .filter(p => p.subject_id || p.chapter_id || p.category_id)

  if (placementPayload.length === 0) {
    toast.error(t('admin.placementRequired'))
    return
  }

  loading.value = true
  try {
    const body = {
      title: title.value,
      content: content.value || null,
      is_free: isFree.value,
      price: isFree.value ? 0 : price.value,
      content_url: contentUrl.value || null,
      placements: placementPayload,
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
      <UiDialogContent class="max-w-5xl max-h-[90vh] overflow-y-auto">
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
              <UiLabel>{{ t('admin.field.description') }}</UiLabel>
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
                  <span class="truncate text-xs text-muted-foreground max-w-md">{{ fileName || t('admin.lessonModal.fileAttached') }}</span>
                  <UiButton type="button" variant="ghost" size="sm" @click="clearContent">
                    {{ t('admin.lessonModal.removeFile') }}
                  </UiButton>
                </div>
                <p v-else class="mt-2 text-xs text-muted-foreground">{{ t('admin.lessonModal.noFile') }}</p>
              </div>
            </div>
          </fieldset>

          <!-- Pricing -->
          <fieldset class="space-y-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ t('admin.field.price') }}</p>
            <div class="flex flex-wrap items-center gap-4">
              <div class="flex items-center gap-2">
                <Checkbox id="lesson-free" v-model="isFree" />
                <UiLabel for="lesson-free">{{ t('admin.field.isFree') }}</UiLabel>
              </div>
              <div class="relative min-w-[120px] max-w-[140px] flex-1">
                <UiInput
                  v-model.number="price"
                  type="number"
                  min="0"
                  step="0.1"
                  :disabled="isFree"
                  class="pr-8"
                />
                <span
                  class="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                  aria-hidden="true"
                >{{ t('admin.field.currencySymbol') }}</span>
              </div>
            </div>
          </fieldset>

          <!-- Placements -->
          <fieldset class="space-y-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ t('admin.field.placements') }}</p>

            <div class="space-y-3">
            <div
              v-for="row in placements"
              :key="row.key"
              class="flex items-end gap-3 rounded-lg border border-border p-3"
            >
              <div class="min-w-0 flex-1 space-y-1.5">
                <UiLabel>{{ t('admin.placementType') }}</UiLabel>
                <Select
                  :model-value="row.type"
                  @update:model-value="(v) => onPlacementTypeChange(row, String(v) as 'subject' | 'chapter' | 'category')"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subject">{{ t('admin.placementSubject') }}</SelectItem>
                    <SelectItem value="chapter">{{ t('admin.placementChapter') }}</SelectItem>
                    <SelectItem value="category">{{ t('admin.placementCategory') }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <template v-if="row.type === 'subject'">
                <div class="min-w-0 flex-1 space-y-1.5">
                  <UiLabel>{{ t('admin.field.grade') }}</UiLabel>
                  <Select
                    :model-value="row.gradeId"
                    @update:model-value="(v) => onPlacementGradeChange(row, String(v))"
                  >
                    <SelectTrigger>
                      <SelectValue :placeholder="t('admin.selectGrade')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div v-if="row.gradeId" class="min-w-0 flex-1 space-y-1.5">
                  <UiLabel>{{ t('admin.field.subject') }}</UiLabel>
                  <Select
                    :model-value="row.subjectId"
                    @update:model-value="(v) => (row.subjectId = String(v))"
                  >
                    <SelectTrigger>
                      <SelectValue :placeholder="t('admin.selectSubject')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="s in subjectsForGrade(row.gradeId)" :key="s.id" :value="s.id">{{ s.name }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </template>

              <!-- Chapter cascade -->
              <template v-else-if="row.type === 'chapter'">
                <div class="min-w-0 flex-1 space-y-1.5">
                  <UiLabel>{{ t('admin.field.grade') }}</UiLabel>
                  <Select
                    :model-value="row.gradeId"
                    @update:model-value="(v) => onPlacementGradeChange(row, String(v))"
                  >
                    <SelectTrigger>
                      <SelectValue :placeholder="t('admin.selectGrade')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div v-if="row.gradeId" class="min-w-0 flex-1 space-y-1.5">
                  <UiLabel>{{ t('admin.field.subject') }}</UiLabel>
                  <Select
                    :model-value="row.subjectId"
                    @update:model-value="(v) => onPlacementSubjectChange(row, String(v))"
                  >
                    <SelectTrigger>
                      <SelectValue :placeholder="t('admin.selectSubject')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="s in subjectsForGrade(row.gradeId)" :key="s.id" :value="s.id">{{ s.name }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div v-if="row.subjectId" class="min-w-0 flex-1 space-y-1.5">
                  <UiLabel>{{ t('admin.field.chapter') }}</UiLabel>
                  <Select v-model="row.chapterId">
                    <SelectTrigger>
                      <SelectValue :placeholder="t('admin.selectChapter')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="c in chaptersForSubject(row.subjectId)" :key="c.id" :value="c.id">{{ c.title }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </template>

              <!-- Category -->
              <div v-else class="min-w-0 flex-1 space-y-1.5">
                <UiLabel>{{ t('admin.field.category') }}</UiLabel>
                <Select v-model="row.categoryId">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.selectCategory')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <UiButton
                v-if="placements.length > 1"
                type="button"
                variant="ghost"
                size="sm"
                class="mb-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                :aria-label="t('admin.removePlacement')"
                @click="removePlacement(row.key)"
              >
                <VIcon name="bi-trash" class="size-4" />
              </UiButton>
            </div>
            </div>

            <UiButton type="button" variant="outline" size="sm" class="gap-1.5" @click="addPlacement">
              <VIcon name="bi-plus-circle" class="size-4" />
              {{ t('admin.addPlacement') }}
            </UiButton>
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
