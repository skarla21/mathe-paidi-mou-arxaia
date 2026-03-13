<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import UiButton from '~/components/ui/Button.vue'

const { t } = useI18n()
const props = defineProps<{ src: string }>()

const container = ref<HTMLElement | null>(null)
const pageNum = ref(1)
const totalPages = ref(0)
const scale = ref(1.2)
const loading = ref(true)
let pdfDoc: any = null
let pdfjs: typeof import('pdfjs-dist') | null = null

async function loadPdf() {
  if (!props.src || !container.value || import.meta.server) return
  loading.value = true
  try {
    if (!pdfjs) {
      pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
    }
    pdfDoc = await pdfjs.getDocument(props.src).promise
    totalPages.value = pdfDoc.numPages
    pageNum.value = 1
    await renderPage()
  } catch (e) {
    console.error('PDF load error', e)
  } finally {
    loading.value = false
  }
}

async function renderPage() {
  if (!pdfDoc || !container.value || !pdfjs) return
  const page = await pdfDoc.getPage(pageNum.value)
  const viewport = page.getViewport({ scale: scale.value })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  canvas.height = viewport.height
  canvas.width = viewport.width
  container.value.innerHTML = ''
  container.value.appendChild(canvas)
  await page.render({ canvasContext: ctx, viewport }).promise
}

function prev() {
  if (pageNum.value <= 1) return
  pageNum.value--
}
function next() {
  if (pageNum.value >= totalPages.value) return
  pageNum.value++
}

watch([pageNum, scale], () => { renderPage() })
watch(() => props.src, () => { loadPdf() })

onMounted(() => { loadPdf() })
onUnmounted(() => { pdfDoc = null })
</script>

<template>
  <div class="border rounded-lg overflow-hidden bg-muted/30">
    <div class="flex items-center gap-2 p-2 border-b bg-card">
      <UiButton variant="outline" size="sm" :disabled="pageNum <= 1" @click="prev">{{ t('pdf.prev') }}</UiButton>
      <span class="text-sm text-muted-foreground">{{ pageNum }} / {{ totalPages }}</span>
      <UiButton variant="outline" size="sm" :disabled="pageNum >= totalPages" @click="next">{{ t('pdf.next') }}</UiButton>
      <UiButton variant="ghost" size="sm" @click="scale = Math.max(0.5, scale - 0.2)">−</UiButton>
      <UiButton variant="ghost" size="sm" @click="scale = Math.min(2, scale + 0.2)">+</UiButton>
    </div>
    <div v-if="loading" class="p-8 text-center text-muted-foreground">{{ t('pdf.loading') }}</div>
    <div ref="container" class="flex justify-center p-4 min-h-[400px]" />
  </div>
</template>
