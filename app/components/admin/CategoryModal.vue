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

const props = defineProps<{
  open: boolean
  category: { id: string; name: string; description?: string | null; image_url?: string | null; order: number } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()

const name = ref('')
const description = ref('')
const loading = ref(false)
const attempted = ref(false)
const dragActive = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const adminFetch = useAdminFetch()
const {
  imageUrl,
  uploading,
  progress: uploadProgress,
  statusLabel: uploadStatusLabel,
  resetImage,
  closeImage,
  keepImage,
  releaseUnsaved,
  uploadImage,
  clearImage,
} = useAdminImageDraft('category')

const nameMissing = computed(() => attempted.value && !name.value.trim())

watch(() => props.open, (val) => {
  if (!val) {
    closeImage(loading.value)
    return
  }
  attempted.value = false
  name.value = props.category?.name ?? ''
  description.value = props.category?.description ?? ''
  resetImage(props.category?.image_url)
})

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) void uploadImage(input.files[0], loading.value)
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragActive.value = false
  if (e.dataTransfer?.files?.[0]) void uploadImage(e.dataTransfer.files[0], loading.value)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragActive.value = true
}

function onDragLeave() {
  dragActive.value = false
}

async function onSubmit() {
  if (uploading.value) return
  attempted.value = true
  if (nameMissing.value) return
  loading.value = true
  try {
    const body = { name: name.value, description: description.value || null, image_url: imageUrl.value || null }
    if (props.category) {
      await adminFetch(`/api/admin/categories/${props.category.id}`, { method: 'PATCH', body })
    } else {
      await adminFetch('/api/admin/categories', { method: 'POST', body: { ...body, order: 0 } })
    }
    keepImage()
    emit('saved')
    emit('close')
  } catch (e: unknown) {
    if (!props.open) releaseUnsaved()
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
      <UiDialogContent class="max-w-lg">
        <UiDialogHeader>
          <UiDialogTitle>{{ props.category ? 'Επεξεργασία' : 'Δημιουργία' }} — Κατηγορίες</UiDialogTitle>
          <UiDialogDescription class="sr-only">Δημιουργία ή επεξεργασία κατηγορίας υλικού.</UiDialogDescription>
        </UiDialogHeader>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <UiLabel for="category-name">Όνομα</UiLabel>
            <UiInput id="category-name" v-model="name" :aria-invalid="nameMissing || undefined" :class="nameMissing ? 'border-destructive' : ''" />
            <p v-if="nameMissing" class="text-xs text-destructive">Το πεδίο «Όνομα» είναι υποχρεωτικό</p>
          </div>
          <div class="space-y-1.5">
            <UiLabel>Περιγραφή</UiLabel>
            <UiTextarea v-model="description" :rows="3" />
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
                <UiButton type="button" variant="outline" size="sm" :disabled="loading || uploading" @click="fileInput?.click()">
                  Επιλογή αρχείου
                </UiButton>
                <input ref="fileInput" type="file" accept="image/jpeg,image/png" class="hidden" @change="onFileSelect">
              </div>
              <UiProgress v-if="uploading" :model-value="uploadProgress" class="mt-3 h-2" />
              <p v-if="uploading" class="mt-2 text-xs text-muted-foreground" aria-live="polite">{{ uploadStatusLabel }}</p>
              <div v-else-if="imageUrl" class="mt-3 flex items-center justify-center gap-2">
                <img :src="imageUrl" alt="" class="h-16 w-16 rounded-md object-cover border border-border">
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
            <UiButton type="submit" :disabled="loading || uploading">{{ loading ? 'Φόρτωση...' : 'Αποθήκευση' }}</UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
