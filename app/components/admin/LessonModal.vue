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
  lesson: {
    id: string; title: string; content: string | null; is_free: boolean
    pdf_url: string | null; order: number; price: number
    chapter_id: string | null; subject_id: string | null; category_id: string | null
  } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()

const title = ref('')
const content = ref('')
const isFree = ref(true)
const price = ref(0)
const pdfUrl = ref('')
const order = ref(0)
const assignment = ref<'chapter' | 'subject' | 'category'>('chapter')
const chapterId = ref('')
const subjectId = ref('')
const categoryId = ref('')
const chapters = ref<{ id: string; title: string }[]>([])
const subjects = ref<{ id: string; name: string }[]>([])
const categories = ref<{ id: string; name: string }[]>([])
const loading = ref(false)

watch(() => props.open, async (val) => {
  if (!val) return
  title.value = props.lesson?.title ?? ''
  content.value = props.lesson?.content ?? ''
  isFree.value = props.lesson?.is_free ?? true
  price.value = props.lesson?.price ?? 0
  pdfUrl.value = props.lesson?.pdf_url ?? ''
  order.value = props.lesson?.order ?? 0
  chapterId.value = props.lesson?.chapter_id ?? ''
  subjectId.value = props.lesson?.subject_id ?? ''
  categoryId.value = props.lesson?.category_id ?? ''
  assignment.value = props.lesson?.chapter_id
    ? 'chapter'
    : props.lesson?.subject_id
      ? 'subject'
      : 'category'
  const [ch, sub, cat] = await Promise.all([
    $fetch<{ id: string; title: string }[]>('/api/admin/chapters'),
    $fetch<{ id: string; name: string }[]>('/api/admin/subjects'),
    $fetch<{ id: string; name: string }[]>('/api/admin/categories'),
  ])
  chapters.value = ch
  subjects.value = sub
  categories.value = cat
})

async function onSubmit() {
  loading.value = true
  try {
    const body = {
      title: title.value, content: content.value || null,
      is_free: isFree.value,
      price: isFree.value ? 0 : price.value,
      pdf_url: pdfUrl.value || null, order: order.value,
      chapter_id: assignment.value === 'chapter' ? chapterId.value || null : null,
      subject_id: assignment.value === 'subject' ? subjectId.value || null : null,
      category_id: assignment.value === 'category' ? categoryId.value || null : null,
    }
    if (props.lesson) {
      await $fetch(`/api/admin/lessons/${props.lesson.id}`, { method: 'PATCH', body })
    } else {
      await $fetch('/api/admin/lessons', { method: 'POST', body })
    }
    emit('saved'); emit('close')
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
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.title') }}</UiLabel>
            <UiInput v-model="title" required />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.content') }}</UiLabel>
            <textarea v-model="content" rows="3" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div class="flex items-center gap-2">
            <input id="lesson-free" v-model="isFree" type="checkbox" class="h-4 w-4">
            <UiLabel for="lesson-free">{{ t('admin.field.isFree') }}</UiLabel>
          </div>
          <div v-if="!isFree" class="space-y-1.5">
            <UiLabel>{{ t('admin.field.price') }}</UiLabel>
            <UiInput v-model.number="price" type="number" min="0" />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.pdfUrl') }}</UiLabel>
            <UiInput v-model="pdfUrl" :placeholder="t('admin.placeholder.url')" />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.order') }}</UiLabel>
            <UiInput v-model.number="order" type="number" min="0" />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.assignedTo') }}</UiLabel>
            <div class="flex gap-4">
              <label class="flex items-center gap-1.5 text-sm cursor-pointer">
                <input v-model="assignment" type="radio" value="chapter"> {{ t('admin.assignChapter') }}
              </label>
              <label class="flex items-center gap-1.5 text-sm cursor-pointer">
                <input v-model="assignment" type="radio" value="subject"> {{ t('admin.assignSubject') }}
              </label>
              <label class="flex items-center gap-1.5 text-sm cursor-pointer">
                <input v-model="assignment" type="radio" value="category"> {{ t('admin.assignCategory') }}
              </label>
            </div>
          </div>
          <div v-if="assignment === 'chapter'" class="space-y-1.5">
            <UiLabel>{{ t('admin.field.chapter') }}</UiLabel>
            <select v-model="chapterId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="" disabled>{{ t('admin.selectChapter') }}</option>
              <option v-for="c in chapters" :key="c.id" :value="c.id">{{ c.title }}</option>
            </select>
          </div>
          <div v-if="assignment === 'subject'" class="space-y-1.5">
            <UiLabel>{{ t('admin.field.subject') }}</UiLabel>
            <select v-model="subjectId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="" disabled>{{ t('admin.selectSubject') }}</option>
              <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div v-if="assignment === 'category'" class="space-y-1.5">
            <UiLabel>{{ t('admin.field.category') }}</UiLabel>
            <select v-model="categoryId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="" disabled>{{ t('admin.selectCategory') }}</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
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
