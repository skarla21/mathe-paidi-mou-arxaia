<script setup lang="ts">
import { computed } from 'vue'
import LessonPdfViewer from '~/components/lesson/PdfViewer.vue'

const props = defineProps<{ src: string }>()
const { t } = useI18n()

const pathPart = computed(() => (props.src || '').split('?')[0] ?? '')
const isPdf = computed(() => /\.pdf$/i.test(pathPart.value))
const isImage = computed(() => /\.(jpg|jpeg|png)$/i.test(pathPart.value))
</script>

<template>
  <LessonPdfViewer v-if="isPdf" :src="src" />
  <div
    v-else-if="isImage"
    class="border rounded-lg overflow-hidden bg-muted/30 flex justify-center p-4 min-h-[200px]"
  >
    <img
      :src="src"
      alt=""
      class="max-w-full h-auto rounded object-contain"
      loading="lazy"
    >
  </div>
  <div
    v-else
    class="border rounded-lg overflow-hidden bg-muted/30 p-8 text-center text-muted-foreground"
  >
    {{ t('lesson.contentUnsupported') }}
  </div>
</template>
