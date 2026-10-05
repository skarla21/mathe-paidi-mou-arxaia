<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'

interface Category {
  id: string
  name: string
  description?: string | null
}

interface Lesson {
  id: string
  slug: string
  title: string
  is_free: boolean
}

const route = useRoute()
const categorySlug = route.params.categoryId as string

const { data: category, error } = await useFetch<Category>(`/api/categories/${categorySlug}`)
throwIfMissing(error.value, !category.value)

const { data: lessonsData } = await useFetch<Lesson[]>('/api/lessons', {
  query: { category_id: category.value!.id },
})
const lessons = computed(() => lessonsData.value ?? [])

useHead(() => ({ title: category.value?.name ?? 'Κατηγορία' }))

onMounted(() => {
  if (import.meta.client) {
    const { revealSection } = useGsapReveal()
    nextTick(() => {
      revealSection('#category-title')
      revealSection('#category-lessons')
    })
  }
})
</script>

<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-12">
    <div id="category-title">
      <LayoutPageIntro eyebrow="Κατηγορίες" :title="category?.name ?? 'Κατηγορία'" :lead="category?.description ?? undefined" />
    </div>
    <h2 id="category-lessons" class="font-heading text-xl font-semibold mt-8">Υλικό</h2>
    <div class="space-y-3 mt-4">
      <NuxtLink
        v-for="l in lessons"
        :key="l.id"
        :to="`/category/${categorySlug}/${l.slug}`"
      >
        <UiCard class="flex cursor-pointer items-center justify-between rounded-3xl p-4 shadow-sm transition-colors hover:bg-secondary">
          <span class="font-medium text-foreground">{{ l.title }}</span>
          <VIcon v-if="!l.is_free" name="bi-gem" class="size-4 text-muted-foreground" aria-hidden="true" />
        </UiCard>
      </NuxtLink>
    </div>
    <p v-if="lessons.length === 0" class="text-muted-foreground mt-4">Δεν υπάρχει ακόμη υλικό.</p>
  </div>
</template>
