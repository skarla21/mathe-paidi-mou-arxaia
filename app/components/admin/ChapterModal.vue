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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const props = defineProps<{
  open: boolean
  chapter: {
    id: string; title: string; description: string | null
    subject_id: string; image_url: string | null
  } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const adminFetch = useAdminFetch()

const title = ref('')
const description = ref('')
const gradeId = ref('')
const subjectId = ref('')
const imageUrl = ref('')
const grades = ref<{ id: string; name: string }[]>([])
const subjects = ref<{ id: string; name: string; grade_id: string }[]>([])
const loading = ref(false)
const attempted = ref(false)
const initializing = ref(false)

const filteredSubjects = computed(() =>
  gradeId.value ? subjects.value.filter(s => s.grade_id === gradeId.value) : [],
)
const uploading = ref(false)
const uploadProgress = ref(0)
const dragActive = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png'] as const
const MAX_IMAGE_BYTES = 20 * 1024 * 1024

const titleMissing = computed(() => attempted.value && !title.value.trim())
const gradeMissing = computed(() => attempted.value && !gradeId.value)
const subjectMissing = computed(() => attempted.value && !!gradeId.value && !subjectId.value)

watch(() => props.open, async (val) => {
  if (!val) return
  attempted.value = false
  initializing.value = true
  title.value = props.chapter?.title ?? ''
  description.value = props.chapter?.description ?? ''
  gradeId.value = ''
  subjectId.value = props.chapter?.subject_id ?? ''
  imageUrl.value = props.chapter?.image_url ?? ''
  try {
    const [gr, sub] = await Promise.all([
      adminFetch<{ id: string; name: string }[]>('/api/admin/grades'),
      adminFetch<{ id: string; name: string; grade_id: string }[]>('/api/admin/subjects'),
    ])
    grades.value = gr
    subjects.value = sub
    if (props.chapter?.subject_id) {
      const s = subjects.value.find(x => x.id === props.chapter!.subject_id)
      if (s) gradeId.value = s.grade_id
    }
  } catch {
    toast.error('Κάτι πήγε στραβά')
    grades.value = []
    subjects.value = []
  } finally {
    nextTick(() => { initializing.value = false })
  }
})

watch(gradeId, () => {
  if (initializing.value) return
  subjectId.value = ''
})

async function uploadImage(file: File) {
  if (uploading.value) return
  if (!ALLOWED_IMAGE_MIMES.includes(file.type as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    toast.error('Επιτρέπονται μόνο εικόνες JPEG και PNG')
    return
  }
  if (file.size > MAX_IMAGE_BYTES) {
    toast.error('Η εικόνα πρέπει να είναι μικρότερη από 20MB')
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
    formData.append('entity', 'chapter')
    const res = await adminFetch<{ url: string }>('/api/admin/upload', { method: 'POST', body: formData })
    imageUrl.value = res.url
    uploadProgress.value = 100
    toast.success('Το αρχείο μεταφορτώθηκε επιτυχώς')
  } catch {
    toast.error('Η μεταφόρτωση απέτυχε')
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

function clearImage() {
  imageUrl.value = ''
}

async function onSubmit() {
  attempted.value = true
  if (titleMissing.value || !gradeId.value || !subjectId.value) return
  loading.value = true
  try {
    const body = {
      title: title.value, description: description.value || null,
      subject_id: subjectId.value,
      image_url: imageUrl.value || null,
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
    toast.error(err?.data?.message ?? 'Κάτι πήγε στραβά')
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
          <UiDialogTitle>{{ props.chapter ? 'Επεξεργασία' : 'Δημιουργία' }} — Κεφάλαια</UiDialogTitle>
          <UiDialogDescription class="sr-only">Δημιουργία ή επεξεργασία κεφαλαίου και ανάθεσή του σε μάθημα.</UiDialogDescription>
        </UiDialogHeader>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <UiLabel>Τίτλος</UiLabel>
            <UiInput v-model="title" :aria-invalid="titleMissing || undefined" :class="titleMissing ? 'border-destructive' : ''" />
            <p v-if="titleMissing" class="text-xs text-destructive">Το πεδίο «Τίτλος» είναι υποχρεωτικό</p>
          </div>
          <div class="space-y-1.5">
            <UiLabel>Περιγραφή</UiLabel>
            <UiTextarea v-model="description" :rows="3" />
          </div>
          <div class="space-y-1.5">
            <UiLabel>Τάξη</UiLabel>
            <Select v-model="gradeId">
              <SelectTrigger :aria-invalid="gradeMissing || undefined">
                <SelectValue placeholder="Επιλογή τάξης…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</SelectItem>
              </SelectContent>
            </Select>
            <p v-if="gradeMissing" class="text-xs text-destructive">Το πεδίο «Τάξη» είναι υποχρεωτικό</p>
          </div>
          <div v-if="gradeId" class="space-y-1.5">
            <UiLabel>Μάθημα</UiLabel>
            <Select v-model="subjectId">
              <SelectTrigger :aria-invalid="subjectMissing || undefined">
                <SelectValue placeholder="Επιλογή μαθήματος…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="s in filteredSubjects" :key="s.id" :value="s.id">{{ s.name }}</SelectItem>
              </SelectContent>
            </Select>
            <p v-if="subjectMissing" class="text-xs text-destructive">Το πεδίο «Μάθημα» είναι υποχρεωτικό</p>
          </div>
          <div class="space-y-1.5">
            <UiLabel>URL εικόνας</UiLabel>
            <div
              class="rounded-lg border-2 border-dashed p-4 text-center transition-colors"
              :class="dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
              @drop="onDrop"
              @dragover="onDragOver"
              @dragleave="onDragLeave"
            >
              <div class="flex flex-col items-center gap-2">
                <VIcon name="bi-cloud-arrow-up" class="size-8 text-muted-foreground" />
                <p class="text-sm font-medium">Σύρε και άφησε εικόνα εδώ, ή κάνε κλικ για επιλογή</p>
                <p class="text-xs text-muted-foreground">Εικόνες μέγ. 20MB</p>
                <UiButton
                  type="button"
                  variant="outline"
                  size="sm"
                  :disabled="uploading"
                  @click="fileInput?.click()"
                >
                  Επιλογή αρχείου
                </UiButton>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/jpeg,image/png"
                  class="hidden"
                  @change="onFileSelect"
                >
              </div>
              <UiProgress v-if="uploading" :model-value="uploadProgress" class="mt-3 h-2" />
              <div v-else-if="imageUrl" class="mt-3 flex items-center justify-center gap-2">
                <img :src="imageUrl" alt="" class="h-16 w-16 rounded-md object-cover border border-border" >
                <UiButton type="button" variant="ghost" size="sm" @click="clearImage">
                  Αφαίρεση αρχείου
                </UiButton>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">Ή επικόλληση URL</p>
            <UiInput v-model="imageUrl" placeholder="https://..." />
          </div>
          <UiDialogFooter>
            <UiButton type="button" variant="cancel" @click="emit('close')">Ακύρωση</UiButton>
            <UiButton type="submit" :disabled="loading">{{ loading ? 'Φόρτωση...' : 'Αποθήκευση' }}</UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
