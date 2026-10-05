<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import type { Grade, Subject, Chapter } from '~/types/database'

const route = useRoute()
const gradeSlug = route.params.grade as string
const subjectSlug = route.params.subject as string

const { data: gradesData, error: gradesError } = await useFetch<Grade[]>('/api/grades')
throwIfMissing(gradesError.value, false)
const grade = gradesData.value?.find((g) => g.slug === gradeSlug)
throwIfMissing(null, !grade)
const { data: subjectsData, error: subjectsError } = await useFetch<Subject[]>('/api/subjects', {
  query: { grade_id: grade!.id },
})
throwIfMissing(subjectsError.value, false)
const subject = subjectsData.value?.find((s) => s.slug === subjectSlug)
throwIfMissing(null, !subject)
const { data: chaptersData } = await useFetch<Chapter[]>('/api/chapters', {
  query: { subject_id: subject!.id },
})
type SubjectLesson = { id: string; slug: string; title: string; is_free: boolean }
const { data: subjectLessonsData } = await useFetch<SubjectLesson[]>('/api/lessons', {
  query: { subject_id: subject!.id },
})
const subjectLessons = computed(() => subjectLessonsData.value ?? [])

const chapters = computed(() =>
  (chaptersData.value ?? []).slice().sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
)

useHead(() => ({
  title: subject ? `${subject.name} - ${grade?.name}` : 'Μάθημα',
}))
</script>

<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-12">
    <NuxtLink
      :to="`/grade/${grade?.slug}`"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
    >
      <VIcon name="bi-arrow-left" class="size-3.5" aria-hidden="true" />
      {{ grade?.name }}
    </NuxtLink>
    <LayoutPageIntro class="mt-4" :title="subject?.name ?? 'Μάθημα'" />

    <div v-if="chapters.length > 0" class="mt-8">
      <h2 class="font-heading text-xl font-semibold mb-4">
        Κεφάλαια
      </h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="chapter in chapters"
          :key="chapter.id"
          :to="`/grade/${grade?.slug}/${subject?.slug}/${chapter.slug}`"
          class="block"
        >
          <UiCard class="bobble-card flex items-center justify-between rounded-3xl p-4 shadow-sm transition-shadow hover:shadow-md">
            <UiCardContent class="p-0 flex items-center justify-between w-full gap-2">
              <span class="flex items-center gap-2 min-w-0">
                <VIcon
                  name="bi-journal-bookmark"
                  class="size-4 text-primary shrink-0"
                  aria-hidden="true"
                />
                <span class="font-medium truncate">{{ chapter.title }}</span>
              </span>
              <VIcon
                name="bi-arrow-right"
                class="size-4 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
            </UiCardContent>
          </UiCard>
        </NuxtLink>
      </div>
    </div>

    <div v-if="subjectLessons.length" class="mt-8">
      <h2 class="font-heading text-xl font-semibold mb-4">Υλικό</h2>
      <div class="space-y-3">
        <NuxtLink
          v-for="lesson in subjectLessons"
          :key="lesson.id"
          :to="`/grade/${grade?.slug}/${subject?.slug}/lesson/${lesson.slug}`"
          class="block rounded-3xl border border-border bg-card px-4 py-3 font-medium shadow-sm hover:bg-secondary"
        >
          {{ lesson.title }}
        </NuxtLink>
      </div>
    </div>

    <p
      v-if="chapters.length === 0 && subjectLessons.length === 0"
      class="text-muted-foreground mt-8"
    >
      Δεν υπάρχουν ακόμη κεφάλαια σε αυτό το μάθημα.
    </p>
  </div>
</template>
