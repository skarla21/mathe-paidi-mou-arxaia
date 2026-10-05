<script setup lang="ts">
import LessonView from '~/components/lesson/LessonView.vue'

const route = useRoute()
const { data: tree, error } = await useFetch<{ lesson: { id: string } }>('/api/tree', {
  query: {
    grade: route.params.grade,
    subject: route.params.subject,
    lesson: route.params.lesson,
    placement: 'subject',
  },
})
throwIfMissing(error.value, !tree.value?.lesson)
</script>

<template>
  <LessonView :lesson-id="tree!.lesson.id" />
</template>
