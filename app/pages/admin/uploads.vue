<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiInput from '~/components/ui/Input.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'
import UiProgress from '~/components/ui/Progress.vue'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
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

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.uploadsTitle')}` }))

interface UploadedFile {
  id: string
  name: string
  path: string
  url: string
  size: number
  created_at: string
}

const files = ref<UploadedFile[]>([])
const loading = ref(true)
const uploading = ref(false)
const uploadProgress = ref(0)
const dragActive = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const search = ref('')
const deleteDialogOpen = ref(false)
const deletingPath = ref<string | null>(null)
const deleteLoading = ref(false)

const filteredFiles = computed(() => {
  if (!search.value) return files.value
  const q = search.value.toLowerCase()
  return files.value.filter(f => f.name.toLowerCase().includes(q))
})

async function fetchFiles() {
  loading.value = true
  try {
    files.value = await $fetch<UploadedFile[]>('/api/admin/uploads')
  } catch {
    files.value = []
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

onMounted(fetchFiles)

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function uploadFile(file: File) {
  if (uploading.value) return
  if (file.type !== 'application/pdf') {
    toast.error(t('admin.uploads.pdfOnly'))
    return
  }
  if (file.size > 10 * 1024 * 1024) {
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
    await $fetch('/api/admin/upload', { method: 'POST', body: formData })
    uploadProgress.value = 100
    toast.success(t('admin.uploads.uploadSuccess'))
    await fetchFiles()
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

function copyUrl(url: string) {
  if (!import.meta.client) return
  navigator.clipboard.writeText(url)
  toast.success(t('admin.uploads.urlCopied'))
}

function openDelete(path: string) {
  deletingPath.value = path
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!deletingPath.value) return
  deleteLoading.value = true
  try {
    await $fetch('/api/admin/uploads', { method: 'DELETE', body: { path: deletingPath.value } })
    toast.success(t('admin.uploads.deleteSuccess'))
    await fetchFiles()
    deleteDialogOpen.value = false
  } catch {
    toast.error(t('common.error'))
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold font-heading">{{ t('admin.uploadsTitle') }}</h1>
    </div>
    <p class="text-sm text-muted-foreground">{{ t('admin.uploadsBody') }}</p>

    <!-- Upload zone -->
    <div
      class="relative rounded-lg border-2 border-dashed p-8 text-center transition-colors"
      :class="dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
    >
      <div class="flex flex-col items-center gap-3">
        <VIcon name="bi-cloud-arrow-up" class="size-10 text-muted-foreground" />
        <div>
          <p class="text-sm font-medium">{{ t('admin.uploads.dragDrop') }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ t('admin.uploads.maxSize') }}</p>
        </div>
        <UiButton variant="outline" size="sm" :disabled="uploading" @click="fileInput?.click()">
          {{ t('admin.uploads.selectFile') }}
        </UiButton>
        <input
          ref="fileInput"
          type="file"
          accept="application/pdf"
          class="hidden"
          @change="onFileSelect"
        >
      </div>
      <UiProgress v-if="uploading" :model-value="uploadProgress" class="mt-4 h-2" />
    </div>

    <!-- Search -->
    <div class="relative">
      <VIcon name="bi-search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <UiInput v-model="search" :placeholder="t('admin.search')" class="pl-9" />
    </div>

    <!-- File list -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t('admin.uploads.fileName') }}</TableHead>
            <TableHead>{{ t('admin.uploads.fileSize') }}</TableHead>
            <TableHead>{{ t('admin.uploads.uploadDate') }}</TableHead>
            <TableHead class="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loading">
            <TableRow v-for="i in 3" :key="i">
              <TableCell><UiSkeleton class="h-4 w-48" /></TableCell>
              <TableCell><UiSkeleton class="h-4 w-16" /></TableCell>
              <TableCell><UiSkeleton class="h-4 w-24" /></TableCell>
              <TableCell><UiSkeleton class="h-4 w-20 ml-auto" /></TableCell>
            </TableRow>
          </template>
          <template v-else-if="!filteredFiles.length">
            <TableRow>
              <TableCell :colspan="4" class="h-32 text-center">
                <div class="flex flex-col items-center gap-2 text-muted-foreground">
                  <VIcon name="bi-inbox" class="size-8" />
                  <p>{{ t('admin.uploads.empty') }}</p>
                </div>
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow v-for="f in filteredFiles" :key="f.id">
              <TableCell class="font-medium font-mono text-xs">{{ f.name }}</TableCell>
              <TableCell class="text-muted-foreground text-xs">{{ formatSize(f.size) }}</TableCell>
              <TableCell class="text-muted-foreground text-xs">{{ f.created_at ? new Date(f.created_at).toLocaleDateString() : '—' }}</TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <UiButton size="sm" variant="ghost" @click="copyUrl(f.url)">
                          <VIcon name="bi-clipboard" class="size-4" />
                        </UiButton>
                      </TooltipTrigger>
                      <TooltipContent>{{ t('admin.uploads.copyUrl') }}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <UiButton size="sm" variant="ghost" class="text-destructive" @click="openDelete(f.path)">
                    <VIcon name="bi-trash" class="size-4" />
                  </UiButton>
                </div>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Delete confirmation -->
    <UiAlertDialogRoot v-model:open="deleteDialogOpen">
      <UiAlertDialogPortal>
        <UiAlertDialogOverlay />
        <UiAlertDialogContent>
          <UiAlertDialogHeader>
            <UiAlertDialogTitle>{{ t('admin.modal.deleteTitle') }}</UiAlertDialogTitle>
            <UiAlertDialogDescription>{{ t('admin.uploads.deleteConfirm') }}</UiAlertDialogDescription>
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
