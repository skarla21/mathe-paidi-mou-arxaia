<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'

interface Lesson {
  id: string
  slug: string
  title: string
  is_free: boolean
}

interface Tree {
  grade: { slug: string }
  subject: { slug: string }
  chapter: {
    id: string
    title: string
    description?: string | null
    slug: string
  }
}

const route = useRoute()
const { data: tree, error } = await useFetch<Tree>('/api/tree', {
  query: {
    grade: route.params.grade,
    subject: route.params.subject,
    chapter: route.params.chapter,
  },
})
throwIfMissing(error.value, !tree.value?.chapter)

const chapter = computed(() => tree.value!.chapter)
const lessons = ref<Lesson[]>([])
if (chapter.value?.id) {
  const { data: lessonsData } = await useFetch<Lesson[]>('/api/lessons', {
    query: { chapter_id: chapter.value.id },
  })
  lessons.value = lessonsData.value ?? []
}

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
    <div id="chapter-title">
      <LayoutPageIntro eyebrow="Κεφάλαια" :title="chapter.title" :lead="chapter.description ?? undefined" />
    </div>
    <h2 id="chapter-lessons" class="font-heading text-xl font-semibold mt-8">Υλικό</h2>
    <div class="space-y-3 mt-4">
      <NuxtLink
        v-for="l in lessons"
        :key="l.id"
        :to="`/grade/${tree?.grade.slug}/${tree?.subject.slug}/${chapter.slug}/${l.slug}`"
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
