<script setup lang="ts">
import LessonView from '~/components/lesson/LessonView.vue'

const route = useRoute()
const lessonId = String(route.params.lessonId)
const { data, error } = await useFetch<{ url: string | null }>('/api/resolve', {
  query: { lesson: lessonId },
})
throwIfMissing(error.value, !data.value)
if (data.value?.url) {
  await navigateTo(data.value.url, { redirectCode: 301 })
}
</script>

<template>
  <LessonView v-if="data && !data.url" :lesson-id="lessonId" />
</template>
