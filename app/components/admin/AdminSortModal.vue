<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogFooter from '~/components/ui/dialog/DialogFooter.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiDialogDescription from '~/components/ui/dialog/DialogDescription.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useDragReorderList } from '~/composables/useDragReorderList'

export type AdminSortModalMode = 'subjects' | 'chapters' | 'lessons' | 'categories'

type SortRow = { id: string; label: string }

type LessonSortKind = 'category' | 'chapter' | 'subject' | null

const props = defineProps<{ open: boolean; mode: AdminSortModalMode }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const { t } = useI18n()
const adminFetch = useAdminFetch()

const loading = ref(false)
const saveLoading = ref(false)
const step = ref(0)
const selGrade = ref('')
const selSubject = ref('')
const selChapter = ref('')
const selCategory = ref('')
const lessonKind = ref<LessonSortKind>(null)

const grades = ref<{ id: string; name: string }[]>([])
const subjects = ref<{ id: string; name: string; grade_id: string; order: number }[]>([])
const chapters = ref<{ id: string; title: string; grade_id: string; subject_id: string; order: number }[]>([])
const categories = ref<{ id: string; name: string; order: number }[]>([])

const orderedRows = ref<SortRow[]>([])
const { onDragStart, onDragEnd, onDragOver, onDrop } = useDragReorderList(orderedRows)

const filteredSubjects = computed(() =>
  selGrade.value ? subjects.value.filter(s => s.grade_id === selGrade.value) : [],
)
const filteredChapters = computed(() =>
  selSubject.value ? chapters.value.filter(c => c.subject_id === selSubject.value) : [],
)

const modalTitle = computed(() => {
  switch (props.mode) {
    case 'subjects': return t('admin.sortModal.titleSubjects')
    case 'chapters': return t('admin.sortModal.titleChapters')
    case 'lessons': return t('admin.sortModal.titleLessons')
    case 'categories': return t('admin.sortModal.titleCategories')
    default: return t('admin.sortModal.title')
  }
})

function resetState() {
  step.value = 0
  selGrade.value = ''
  selSubject.value = ''
  selChapter.value = ''
  selCategory.value = ''
  lessonKind.value = null
  orderedRows.value = []
}

watch(() => props.open, async (open) => {
  if (!open) {
    resetState()
    return
  }
  loading.value = true
  resetState()
  try {
    const [gr, sub, ch, cat] = await Promise.all([
      adminFetch<{ id: string; name: string }[]>('/api/admin/grades'),
      adminFetch<{ id: string; name: string; grade_id: string; order: number }[]>('/api/admin/subjects'),
      adminFetch<{ id: string; title: string; grade_id: string; subject_id: string; order: number }[]>('/api/admin/chapters'),
      adminFetch<{ id: string; name: string; order: number }[]>('/api/admin/categories'),
    ])
    grades.value = gr
    subjects.value = sub
    chapters.value = ch
    categories.value = cat

    if (props.mode === 'categories') {
      orderedRows.value = [...cat]
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
        .map(c => ({ id: c.id, label: c.name }))
      step.value = 1
    }
  } catch {
    toast.error(t('common.error'))
    emit('close')
  } finally {
    loading.value = false
  }
})

function goSubjectsList() {
  if (!selGrade.value) return
  const list = subjects.value
    .filter(s => s.grade_id === selGrade.value)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
  orderedRows.value = list.map(s => ({ id: s.id, label: s.name }))
  step.value = 1
}

function goChaptersList() {
  if (!selSubject.value) return
  const list = chapters.value
    .filter(c => c.subject_id === selSubject.value)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
  orderedRows.value = list.map(c => ({ id: c.id, label: c.title }))
  step.value = 2
}

async function goLessonsList() {
  if (lessonKind.value === 'category') {
    if (!selCategory.value) return
    const list = await adminFetch<{ id: string; title: string; order: number }[]>(
      '/api/lessons',
      { query: { category_id: selCategory.value } },
    )
    orderedRows.value = [...list]
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
      .map(l => ({ id: l.id, label: l.title }))
    step.value = 2
    return
  }
  if (lessonKind.value === 'chapter') {
    if (!selChapter.value) return
    const list = await adminFetch<{ id: string; title: string; order: number }[]>(
      '/api/lessons',
      { query: { chapter_id: selChapter.value } },
    )
    orderedRows.value = [...list]
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
      .map(l => ({ id: l.id, label: l.title }))
    step.value = 2
    return
  }
  if (lessonKind.value === 'subject') {
    if (!selSubject.value) return
    const list = await adminFetch<{ id: string; title: string; order: number }[]>(
      '/api/lessons',
      { query: { subject_id: selSubject.value } },
    )
    orderedRows.value = [...list]
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
      .map(l => ({ id: l.id, label: l.title }))
    step.value = 2
  }
}

function pickLessonKind(k: NonNullable<LessonSortKind>) {
  lessonKind.value = k
  selGrade.value = ''
  selSubject.value = ''
  selChapter.value = ''
  selCategory.value = ''
  step.value = 1
}

function back() {
  if (props.mode === 'categories') {
    emit('close')
    return
  }
  if (props.mode === 'subjects') {
    if (step.value >= 1) {
      step.value = 0
      orderedRows.value = []
    }
    return
  }
  if (props.mode === 'chapters') {
    if (step.value === 2) {
      step.value = 1
      orderedRows.value = []
    } else if (step.value === 1) {
      step.value = 0
      selSubject.value = ''
      orderedRows.value = []
    }
    return
  }
  if (props.mode === 'lessons') {
    if (step.value === 2) {
      step.value = 1
      orderedRows.value = []
      return
    }
    if (step.value === 1) {
      step.value = 0
      lessonKind.value = null
      selGrade.value = ''
      selSubject.value = ''
      selChapter.value = ''
      selCategory.value = ''
    }
  }
}

async function saveOrder() {
  if (!orderedRows.value.length) return
  saveLoading.value = true
  try {
    const ids = orderedRows.value.map(r => r.id)
    if (props.mode === 'subjects') {
      await adminFetch('/api/admin/subjects/reorder', {
        method: 'PATCH',
        body: { grade_id: selGrade.value, ids },
      })
    } else if (props.mode === 'chapters') {
      await adminFetch('/api/admin/chapters/reorder', {
        method: 'PATCH',
        body: { subject_id: selSubject.value, ids },
      })
    } else if (props.mode === 'categories') {
      await adminFetch('/api/admin/categories/reorder', {
        method: 'PATCH',
        body: { ids },
      })
    } else if (props.mode === 'lessons') {
      if (lessonKind.value === 'category') {
        await adminFetch('/api/admin/lessons/reorder', {
          method: 'PATCH',
          body: { category_id: selCategory.value, ids },
        })
      } else if (lessonKind.value === 'chapter') {
        await adminFetch('/api/admin/lessons/reorder', {
          method: 'PATCH',
          body: { chapter_id: selChapter.value, ids },
        })
      } else if (lessonKind.value === 'subject') {
        await adminFetch('/api/admin/lessons/reorder', {
          method: 'PATCH',
          body: { subject_id: selSubject.value, ids },
        })
      }
    }
    toast.success(t('admin.saveOrderSuccess'))
    emit('saved')
    emit('close')
  } catch {
    toast.error(t('admin.saveOrderError'))
  } finally {
    saveLoading.value = false
  }
}

function canProceedSubjects() {
  return !!selGrade.value
}

function canProceedChaptersStep0() {
  return !!selGrade.value
}

function canProceedChaptersStep1() {
  return !!selSubject.value
}

function canProceedLessonsStep1() {
  if (lessonKind.value === 'category') return !!selCategory.value
  if (lessonKind.value === 'chapter') return !!selGrade.value && !!selSubject.value && !!selChapter.value
  if (lessonKind.value === 'subject') return !!selGrade.value && !!selSubject.value
  return false
}

watch(selGrade, () => {
  selSubject.value = ''
  selChapter.value = ''
})

watch(selSubject, () => {
  selChapter.value = ''
})
</script>

<template>
  <UiDialog :open="props.open" @update:open="(v: boolean) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent class="max-w-lg max-h-[90vh] overflow-y-auto">
        <UiDialogHeader>
          <UiDialogTitle>{{ modalTitle }}</UiDialogTitle>
          <UiDialogDescription class="sr-only">{{ t('admin.sortModal.description') }}</UiDialogDescription>
        </UiDialogHeader>

        <div v-if="loading" class="py-12 text-center text-muted-foreground">
          {{ t('common.loading') }}
        </div>

        <template v-else>
          <!-- Subjects -->
          <template v-if="mode === 'subjects'">
            <div v-if="step === 0" class="space-y-4 py-2">
              <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.pickGrade') }}</p>
              <Select v-model="selGrade">
                <SelectTrigger>
                  <SelectValue :placeholder="t('admin.selectGrade')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</SelectItem>
                </SelectContent>
              </Select>
              <UiButton :disabled="!canProceedSubjects()" class="w-full" @click="goSubjectsList">
                {{ t('admin.sortModal.continue') }}
              </UiButton>
            </div>
            <div v-else class="space-y-3 py-2">
              <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.dragHint') }}</p>
              <div v-if="!orderedRows.length" class="text-sm text-muted-foreground py-6 text-center">
                {{ t('admin.sortModal.emptyList') }}
              </div>
              <div
                v-for="(row, index) in orderedRows"
                v-else
                :key="row.id"
                class="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-opacity"
                draggable="true"
                @dragstart="onDragStart($event, index)"
                @dragend="onDragEnd"
                @dragover="onDragOver"
                @drop="onDrop($event, index)"
              >
                <div class="cursor-grab active:cursor-grabbing text-muted-foreground shrink-0 rounded p-1 hover:bg-muted" aria-hidden="true">
                  <VIcon name="bi-grip-vertical" class="size-5" />
                </div>
                <span class="min-w-0 flex-1 font-medium">{{ row.label }}</span>
              </div>
            </div>
          </template>

          <!-- Chapters -->
          <template v-else-if="mode === 'chapters'">
            <div v-if="step === 0" class="space-y-4 py-2">
              <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.pickGrade') }}</p>
              <Select v-model="selGrade">
                <SelectTrigger>
                  <SelectValue :placeholder="t('admin.selectGrade')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</SelectItem>
                </SelectContent>
              </Select>
              <UiButton :disabled="!canProceedChaptersStep0()" class="w-full" @click="step = 1">
                {{ t('admin.sortModal.continue') }}
              </UiButton>
            </div>
            <div v-else-if="step === 1" class="space-y-4 py-2">
              <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.pickSubject') }}</p>
              <Select v-model="selSubject">
                <SelectTrigger>
                  <SelectValue :placeholder="t('admin.selectSubject')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in filteredSubjects" :key="s.id" :value="s.id">{{ s.name }}</SelectItem>
                </SelectContent>
              </Select>
              <UiButton :disabled="!canProceedChaptersStep1()" class="w-full" @click="goChaptersList">
                {{ t('admin.sortModal.continue') }}
              </UiButton>
            </div>
            <div v-else class="space-y-3 py-2">
              <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.dragHint') }}</p>
              <div v-if="!orderedRows.length" class="text-sm text-muted-foreground py-6 text-center">
                {{ t('admin.sortModal.emptyList') }}
              </div>
              <div
                v-for="(row, index) in orderedRows"
                v-else
                :key="row.id"
                class="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-opacity"
                draggable="true"
                @dragstart="onDragStart($event, index)"
                @dragend="onDragEnd"
                @dragover="onDragOver"
                @drop="onDrop($event, index)"
              >
                <div class="cursor-grab active:cursor-grabbing text-muted-foreground shrink-0 rounded p-1 hover:bg-muted" aria-hidden="true">
                  <VIcon name="bi-grip-vertical" class="size-5" />
                </div>
                <span class="min-w-0 flex-1 font-medium">{{ row.label }}</span>
              </div>
            </div>
          </template>

          <!-- Categories -->
          <template v-else-if="mode === 'categories'">
            <div v-if="step === 1" class="space-y-3 py-2">
              <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.dragHint') }}</p>
              <div v-if="!orderedRows.length" class="text-sm text-muted-foreground py-6 text-center">
                {{ t('admin.sortModal.emptyList') }}
              </div>
              <div
                v-for="(row, index) in orderedRows"
                v-else
                :key="row.id"
                class="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-opacity"
                draggable="true"
                @dragstart="onDragStart($event, index)"
                @dragend="onDragEnd"
                @dragover="onDragOver"
                @drop="onDrop($event, index)"
              >
                <div class="cursor-grab active:cursor-grabbing text-muted-foreground shrink-0 rounded p-1 hover:bg-muted" aria-hidden="true">
                  <VIcon name="bi-grip-vertical" class="size-5" />
                </div>
                <span class="min-w-0 flex-1 font-medium">{{ row.label }}</span>
              </div>
            </div>
          </template>

          <!-- Lessons -->
          <template v-else-if="mode === 'lessons'">
            <div v-if="step === 0" class="space-y-3 py-2">
              <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.lessonsPickScope') }}</p>
              <div class="flex flex-col gap-2">
                <UiButton variant="outline" class="justify-start h-auto py-3 px-4" @click="pickLessonKind('category')">
                  <span class="text-left">{{ t('admin.sortModal.scopeCategory') }}</span>
                </UiButton>
                <UiButton variant="outline" class="justify-start h-auto py-3 px-4" @click="pickLessonKind('subject')">
                  <span class="text-left">{{ t('admin.sortModal.scopeSubject') }}</span>
                </UiButton>
                <UiButton variant="outline" class="justify-start h-auto py-3 px-4" @click="pickLessonKind('chapter')">
                  <span class="text-left">{{ t('admin.sortModal.scopeChapter') }}</span>
                </UiButton>
              </div>
            </div>

            <div v-else-if="step === 1" class="space-y-4 py-2">
              <template v-if="lessonKind === 'category'">
                <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.pickCategory') }}</p>
                <Select v-model="selCategory">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.selectCategory')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
                  </SelectContent>
                </Select>
              </template>

              <template v-else-if="lessonKind === 'subject'">
                <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.pickGrade') }}</p>
                <Select v-model="selGrade">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.selectGrade')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.pickSubject') }}</p>
                <Select v-model="selSubject">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.selectSubject')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="s in filteredSubjects" :key="s.id" :value="s.id">{{ s.name }}</SelectItem>
                  </SelectContent>
                </Select>
              </template>

              <template v-else-if="lessonKind === 'chapter'">
                <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.pickGrade') }}</p>
                <Select v-model="selGrade">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.selectGrade')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.pickSubject') }}</p>
                <Select v-model="selSubject">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.selectSubject')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="s in filteredSubjects" :key="s.id" :value="s.id">{{ s.name }}</SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.pickChapter') }}</p>
                <Select v-model="selChapter">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.selectChapter')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="c in filteredChapters" :key="c.id" :value="c.id">{{ c.title }}</SelectItem>
                  </SelectContent>
                </Select>
              </template>

              <UiButton :disabled="!canProceedLessonsStep1()" class="w-full" @click="goLessonsList">
                {{ t('admin.sortModal.continue') }}
              </UiButton>
            </div>

            <div v-else-if="step === 2" class="space-y-3 py-2">
              <p class="text-sm text-muted-foreground">{{ t('admin.sortModal.dragHint') }}</p>
              <div v-if="!orderedRows.length" class="text-sm text-muted-foreground py-6 text-center">
                {{ t('admin.sortModal.emptyList') }}
              </div>
              <div
                v-for="(row, index) in orderedRows"
                v-else
                :key="row.id"
                class="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-opacity"
                draggable="true"
                @dragstart="onDragStart($event, index)"
                @dragend="onDragEnd"
                @dragover="onDragOver"
                @drop="onDrop($event, index)"
              >
                <div class="cursor-grab active:cursor-grabbing text-muted-foreground shrink-0 rounded p-1 hover:bg-muted" aria-hidden="true">
                  <VIcon name="bi-grip-vertical" class="size-5" />
                </div>
                <span class="min-w-0 flex-1 font-medium">{{ row.label }}</span>
              </div>
            </div>
          </template>
        </template>

        <UiDialogFooter class="gap-2 sm:gap-0">
          <UiButton variant="outline" @click="emit('close')">{{ t('admin.modal.cancel') }}</UiButton>
          <UiButton
            v-if="!loading && step > 0 && mode !== 'categories'"
            variant="outline"
            @click="back"
          >
            {{ t('admin.sortModal.back') }}
          </UiButton>
          <UiButton
            v-if="!loading && orderedRows.length > 0 && (step > 0 || mode === 'categories')"
            :disabled="saveLoading"
            @click="saveOrder"
          >
            {{ saveLoading ? t('common.loading') : t('admin.saveOrder') }}
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
