<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'

interface Category {
  id: string
  name: string
  description?: string | null
}

interface Lesson {
  id: string
  title: string
  is_free: boolean
}

const route = useRoute()
const categoryId = route.params.categoryId as string
const { t } = useI18n()

const category = ref<Category | null>(null)
const lessons = ref<Lesson[]>([])

const { data: categoryData } = await useFetch(`/api/categories/${categoryId}`)
const { data: lessonsData } = await useFetch('/api/lessons', { query: { category_id: categoryId } })

category.value = categoryData.value as Category | null
lessons.value = (lessonsData.value as unknown as Lesson[]) ?? []

useHead(() => ({ title: category.value ? category.value.name : t('category.title') }))

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
  <div class="container py-8 px-4">
    <div v-if="!category" class="space-y-4">
      <UiSkeleton class="h-9 w-2/3 rounded-xl" />
      <UiSkeleton class="h-5 w-full rounded-lg" />
      <UiSkeleton class="h-5 w-4/5 rounded-lg" />
      <UiSkeleton class="h-6 w-1/3 rounded-lg mt-8" />
      <UiSkeleton class="h-14 w-full rounded-xl" />
      <UiSkeleton class="h-14 w-full rounded-xl" />
      <UiSkeleton class="h-14 w-full rounded-xl" />
    </div>
    <template v-else>
      <h1 id="category-title" class="font-heading text-3xl font-bold">{{ category.name }}</h1>
      <p v-if="category.description" class="mt-2 text-muted-foreground">{{ category.description }}</p>
      <h2 id="category-lessons" class="font-heading text-xl font-semibold mt-8">{{ t('category.lessons') }}</h2>
      <div class="space-y-3 mt-4">
        <NuxtLink
          v-for="l in lessons"
          :key="l.id"
          :to="`/lesson/${l.id}`"
        >
          <UiCard class="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
            <span class="font-medium text-foreground">{{ l.title }}</span>
            <VIcon v-if="!l.is_free" name="bi-gem" class="size-4 text-muted-foreground" aria-hidden="true" />
          </UiCard>
        </NuxtLink>
      </div>
      <p v-if="lessons.length === 0" class="text-muted-foreground mt-4">{{ t('category.noLessonsYet') }}</p>
    </template>
  </div>
</template>
