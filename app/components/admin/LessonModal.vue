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
  lesson: {
    id: string; title: string; content: string | null; is_free: boolean
    pdf_url: string | null; order: number; course_id: string | null; category_id: string | null
  } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()

const title = ref('')
const content = ref('')
const isFree = ref(true)
const pdfUrl = ref('')
const order = ref(0)
const assignment = ref<'course' | 'category' | 'none'>('none')
const courseId = ref('')
const categoryId = ref('')
const courses = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(false)

watch(() => props.open, async (val) => {
  if (!val) return
  title.value = props.lesson?.title ?? ''
  content.value = props.lesson?.content ?? ''
  isFree.value = props.lesson?.is_free ?? true
  pdfUrl.value = props.lesson?.pdf_url ?? ''
  order.value = props.lesson?.order ?? 0
  courseId.value = props.lesson?.course_id ?? ''
  categoryId.value = props.lesson?.category_id ?? ''
  assignment.value = props.lesson?.course_id ? 'course' : props.lesson?.category_id ? 'category' : 'none'
  const [c, cat] = await Promise.all([
    $fetch<any[]>('/api/admin/courses'),
    $fetch<any[]>('/api/admin/categories'),
  ])
  courses.value = c
  categories.value = cat
})

async function onSubmit() {
  loading.value = true
  try {
    const body = {
      title: title.value, content: content.value || null,
      is_free: isFree.value, pdf_url: pdfUrl.value || null, order: order.value,
      course_id: assignment.value === 'course' ? courseId.value || null : null,
      category_id: assignment.value === 'category' ? categoryId.value || null : null,
    }
    if (props.lesson) {
      await $fetch(`/api/admin/lessons/${props.lesson.id}`, { method: 'PATCH', body })
    } else {
      await $fetch('/api/admin/lessons', { method: 'POST', body })
    }
    emit('saved'); emit('close')
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
      <UiDialogContent class="max-w-xl max-h-[90vh] overflow-y-auto">
        <UiDialogHeader>
          <UiDialogTitle>{{ props.lesson ? t('admin.modal.edit') : t('admin.modal.create') }} — {{ t('admin.lessons') }}</UiDialogTitle>
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
            <input id="lesson-free" v-model="isFree" type="checkbox" class="h-4 w-4" >
            <UiLabel for="lesson-free">{{ t('admin.field.isFree') }}</UiLabel>
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.pdfUrl') }}</UiLabel>
            <UiInput v-model="pdfUrl" placeholder="https://..." />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.order') }}</UiLabel>
            <UiInput v-model.number="order" type="number" min="0" />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.assignedTo') }}</UiLabel>
            <div class="flex gap-4">
              <label class="flex items-center gap-1.5 text-sm cursor-pointer">
                <input v-model="assignment" type="radio" value="course" > {{ t('admin.assignCourse') }}
              </label>
              <label class="flex items-center gap-1.5 text-sm cursor-pointer">
                <input v-model="assignment" type="radio" value="category" > {{ t('admin.assignCategory') }}
              </label>
              <label class="flex items-center gap-1.5 text-sm cursor-pointer">
                <input v-model="assignment" type="radio" value="none" > None
              </label>
            </div>
          </div>
          <div v-if="assignment === 'course'" class="space-y-1.5">
            <UiLabel>{{ t('admin.field.course') }}</UiLabel>
            <select v-model="courseId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="" disabled>Select course…</option>
              <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.title }}</option>
            </select>
          </div>
          <div v-if="assignment === 'category'" class="space-y-1.5">
            <UiLabel>{{ t('admin.field.category') }}</UiLabel>
            <select v-model="categoryId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="" disabled>Select category…</option>
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
