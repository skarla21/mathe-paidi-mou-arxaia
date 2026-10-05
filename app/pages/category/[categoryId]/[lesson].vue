<script setup lang="ts">
import LessonView from '~/components/lesson/LessonView.vue'

const route = useRoute()
const { data: tree, error } = await useFetch<{ lesson: { id: string } }>('/api/tree', {
  query: {
    category: route.params.categoryId,
    lesson: route.params.lesson,
  },
})
throwIfMissing(error.value, !tree.value?.lesson)
</script>

<template>
  <LessonView :lesson-id="tree!.lesson.id" />
</template>
