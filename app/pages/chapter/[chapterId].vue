<script setup lang="ts">
const route = useRoute()
const { data, error } = await useFetch<{ url: string }>('/api/resolve', {
  query: { chapter: String(route.params.chapterId) },
})
throwIfMissing(error.value, !data.value?.url)
await navigateTo(data.value!.url, { redirectCode: 301 })
</script>

<template>
  <div />
</template>
