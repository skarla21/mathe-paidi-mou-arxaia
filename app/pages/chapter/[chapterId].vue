<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'

interface Chapter {
  id: string
  title: string
  description?: string | null
  subject_id: string
  image_url?: string | null
  order: number
}

interface Lesson {
  id: string
  title: string
  is_free: boolean
}

const route = useRoute()
const chapterId = route.params.chapterId as string

const chapter = ref<Chapter | null>(null)
const lessons = ref<Lesson[]>([])

const { data: chapterData } = await useFetch(`/api/chapters/${chapterId}`)
const { data: lessonsData } = await useFetch('/api/lessons', { query: { chapter_id: chapterId } })

chapter.value = chapterData.value as Chapter | null
lessons.value = (lessonsData.value as unknown as Lesson[]) ?? []

useHead(() => ({ title: chapter.value ? chapter.value.title : 'Κεφάλαιο' }))

onMounted(() => {
  if (import.meta.client) {
    const { revealSection } = useGsapReveal()
    nextTick(() => {
      revealSection('#chapter-title')
      revealSection('#chapter-lessons')
    })
  }
})
</script>

<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-12">
    <div v-if="!chapter" class="space-y-4">
      <UiSkeleton class="h-9 w-2/3 rounded-xl" />
      <UiSkeleton class="h-5 w-full rounded-lg" />
      <UiSkeleton class="h-5 w-4/5 rounded-lg" />
      <UiSkeleton class="h-6 w-1/3 rounded-lg mt-8" />
      <UiSkeleton class="h-14 w-full rounded-xl" />
      <UiSkeleton class="h-14 w-full rounded-xl" />
      <UiSkeleton class="h-14 w-full rounded-xl" />
    </div>
    <template v-else>
      <div id="chapter-title">
        <LayoutPageIntro eyebrow="Κεφάλαια" title="Κεφάλαιο" :lead="chapter.description ?? undefined" />
      </div>
      <h2 id="chapter-lessons" class="font-heading text-xl font-semibold mt-8">Υλικό</h2>
      <div class="space-y-3 mt-4">
        <NuxtLink
          v-for="l in lessons"
          :key="l.id"
          :to="`/lesson/${l.id}`"
        >
          <UiCard class="flex cursor-pointer items-center justify-between rounded-3xl p-4 shadow-sm transition-colors hover:bg-secondary">
            <span class="font-medium text-foreground">{{ l.title }}</span>
            <VIcon v-if="!l.is_free" name="bi-gem" class="size-4 text-muted-foreground" aria-hidden="true" />
          </UiCard>
        </NuxtLink>
      </div>
      <p v-if="lessons.length === 0" class="text-muted-foreground mt-4">Δεν υπάρχει ακόμη υλικό.</p>
    </template>
  </div>
</template>
