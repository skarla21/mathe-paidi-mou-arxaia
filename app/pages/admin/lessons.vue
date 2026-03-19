<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiInput from '~/components/ui/Input.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import AdminLessonModal from '~/components/admin/LessonModal.vue'
import AdminSortModal from '~/components/admin/AdminSortModal.vue'
import type { Lesson } from '~/types/database'

type Chapter = { id: string; title: string; grade_id: string; subject_id: string }
type Subject = { id: string; name: string; grade_id: string }
type Category = { id: string; name: string }

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.lessonsTitle')}` }))

const adminFetch = useAdminFetch()
const lessons = ref<Lesson[]>([])
const grades = ref<{ id: string; name: string }[]>([])
const subjects = ref<Subject[]>([])
const chapters = ref<Chapter[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const search = ref('')
const gradeId = ref('__all__')
const subjectId = ref('__all__')
const chapterId = ref('__all__')
const categoryId = ref('__all__')
const modalOpen = ref(false)
const sortModalOpen = ref(false)
const editingLesson = ref<Lesson | null>(null)
const deleteDialogOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleteLoading = ref(false)

const filteredSubjects = computed(() =>
  gradeId.value && gradeId.value !== '__all__' ? subjects.value.filter(s => s.grade_id === gradeId.value) : [],
)
const filteredChapters = computed(() =>
  subjectId.value && subjectId.value !== '__all__' ? chapters.value.filter(c => c.subject_id === subjectId.value) : [],
)

const filteredLessons = computed(() => {
  let list = lessons.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(l => l.title.toLowerCase().includes(q))
  }
  if (chapterId.value && chapterId.value !== '__all__') {
    list = list.filter(l => l.chapter_id === chapterId.value)
  } else if (subjectId.value && subjectId.value !== '__all__') {
    list = list.filter(l => l.subject_id === subjectId.value)
  } else if (categoryId.value && categoryId.value !== '__all__') {
    list = list.filter(l => l.category_id === categoryId.value)
  } else if (gradeId.value && gradeId.value !== '__all__') {
    list = list.filter(l => {
      if (l.chapters?.grade_id) return l.chapters.grade_id === gradeId.value
      if (l.subjects?.grade_id) return l.subjects.grade_id === gradeId.value
      return false
    })
  }
  return list
})

watch(gradeId, () => {
  subjectId.value = '__all__'
  chapterId.value = '__all__'
  if (gradeId.value && gradeId.value !== '__all__') categoryId.value = '__all__'
})
watch(subjectId, () => {
  chapterId.value = '__all__'
  if (subjectId.value && subjectId.value !== '__all__') categoryId.value = '__all__'
})
watch(chapterId, () => {
  if (chapterId.value && chapterId.value !== '__all__') categoryId.value = '__all__'
})
watch(categoryId, () => {
  if (categoryId.value && categoryId.value !== '__all__') {
    gradeId.value = '__all__'
    subjectId.value = '__all__'
    chapterId.value = '__all__'
  }
})

async function fetchAll() {
  loading.value = true
  try {
    const [less, gr, sub, ch, cat] = await Promise.all([
      adminFetch<Lesson[]>('/api/admin/lessons'),
      adminFetch<{ id: string; name: string }[]>('/api/admin/grades'),
      adminFetch<Subject[]>('/api/admin/subjects'),
      adminFetch<Chapter[]>('/api/admin/chapters'),
      adminFetch<Category[]>('/api/admin/categories'),
    ])
    lessons.value = less
    grades.value = gr
    subjects.value = sub
    chapters.value = ch
    categories.value = cat
  } catch {
    lessons.value = []
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

function openCreate() { editingLesson.value = null; modalOpen.value = true }
function openEdit(l: Lesson) { editingLesson.value = l; modalOpen.value = true }
function openDelete(id: string) { deletingId.value = id; deleteDialogOpen.value = true }

async function confirmDelete() {
  if (!deletingId.value) return
  deleteLoading.value = true
  try {
    await adminFetch(`/api/admin/lessons/${deletingId.value}`, { method: 'DELETE' })
    await fetchAll()
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
      <h1 class="text-2xl font-bold font-heading">{{ t('admin.lessonsTitle') }}</h1>
      <div class="flex items-center gap-2">
        <UiButton variant="outline" @click="sortModalOpen = true">
          <VIcon name="bi-arrow-down-up" class="mr-2 size-4" />
          {{ t('admin.sortMaterial') }}
        </UiButton>
        <UiButton @click="openCreate">
          <VIcon name="bi-plus-circle" class="mr-2 size-4" />
          {{ t('admin.modal.create') }}
        </UiButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-4 mb-6">
      <Select v-model="gradeId">
        <SelectTrigger class="w-[160px]">
          <SelectValue :placeholder="t('admin.selectGrade')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{{ t('admin.selectGrade') }}</SelectItem>
          <SelectItem v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="subjectId">
        <SelectTrigger class="w-[160px]">
          <SelectValue :placeholder="t('admin.selectSubject')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{{ t('admin.selectSubject') }}</SelectItem>
          <SelectItem v-for="s in filteredSubjects" :key="s.id" :value="s.id">{{ s.name }}</SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="chapterId">
        <SelectTrigger class="w-[180px]">
          <SelectValue :placeholder="t('admin.selectChapter')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{{ t('admin.selectChapter') }}</SelectItem>
          <SelectItem v-for="c in filteredChapters" :key="c.id" :value="c.id">{{ c.title }}</SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="categoryId">
        <SelectTrigger class="w-[160px]">
          <SelectValue :placeholder="t('admin.selectCategory')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{{ t('admin.selectCategory') }}</SelectItem>
          <SelectItem v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
        </SelectContent>
      </Select>
      <div class="relative flex-1 min-w-[200px]">
        <VIcon name="bi-search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <UiInput v-model="search" :placeholder="t('admin.search')" class="pl-9" />
      </div>
    </div>

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="space-y-3">
        <UiCard v-for="i in 5" :key="i">
          <UiCardContent class="p-4 flex items-center gap-4">
            <UiSkeleton class="size-8 shrink-0" />
            <UiSkeleton class="h-4 flex-1" />
          </UiCardContent>
        </UiCard>
      </div>
    </template>

    <!-- Cards -->
    <template v-else>
      <div v-if="!filteredLessons.length" class="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <VIcon name="bi-inbox" class="size-12 mx-auto mb-3 opacity-50" />
        <p>{{ t('admin.lessonsEmpty') }}</p>
      </div>
      <div v-else class="space-y-3">
        <UiCard v-for="l in filteredLessons" :key="l.id">
          <UiCardContent class="p-4 flex items-center gap-4">
            <div class="size-12 rounded bg-muted shrink-0 flex items-center justify-center">
              <VIcon name="bi-journal-text" class="size-6 text-muted-foreground" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-medium">{{ l.title }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-muted-foreground">{{ l.is_free ? t('admin.field.isFree') : t('admin.paid') }}</span>
                <span v-if="l.content_url" class="text-xs text-muted-foreground">| {{ t('admin.field.file') }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UiButton size="sm" variant="outline" @click.stop="openEdit(l)">{{ t('admin.modal.edit') }}</UiButton>
              <UiButton size="sm" variant="destructive" @click.stop="openDelete(l.id)">{{ t('admin.modal.delete') }}</UiButton>
            </div>
          </UiCardContent>
        </UiCard>
      </div>
    </template>

    <AdminLessonModal :open="modalOpen" :lesson="editingLesson" @close="modalOpen = false" @saved="fetchAll" />

    <AdminSortModal
      :open="sortModalOpen"
      mode="lessons"
      @close="sortModalOpen = false"
      @saved="fetchAll"
    />

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
