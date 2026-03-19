<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import type { Grade, Subject, SubjectOutlineRow } from '~/types/database'

const route = useRoute()
const gradeId = route.params.grade as string
const subjectId = route.params.subject as string
const { t } = useI18n()

const grade = ref<Grade | null>(null)
const subject = ref<Subject | null>(null)

const { data: gradesData } = await useFetch('/api/grades')
const { data: subjectsData } = await useFetch('/api/subjects', {
  query: { grade_id: gradeId },
})
const { data: outlineData } = await useFetch<SubjectOutlineRow[]>(`/api/subjects/${subjectId}/outline`)

grade.value =
  (gradesData.value as Grade[] | null)?.find((g) => g.id === gradeId) ?? null
subject.value =
  (subjectsData.value as Subject[] | null)?.find((s) => s.id === subjectId) ?? null

const outline = computed(() => outlineData.value ?? [])

useHead(() => ({
  title: subject.value
    ? `${subject.value.name} - ${grade.value?.name}`
    : t('subject.title'),
}))
</script>

<template>
  <div class="container py-8 px-4">
    <NuxtLink
      :to="`/grade/${gradeId}`"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
    >
      <VIcon name="bi-arrow-left" class="size-3.5" aria-hidden="true" />
      {{ grade?.name }}
    </NuxtLink>
    <h1 class="text-3xl font-bold mt-2 font-heading">
      {{ subject?.name ?? t('subject.title') }}
    </h1>

    <div v-if="outline.length > 0" class="mt-8">
      <h2 class="font-heading text-xl font-semibold mb-4">
        {{ t('subject.outlineSection') }}
      </h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="item in outline"
          :key="`${item.kind}-${item.id}`"
          :to="item.kind === 'chapter' ? `/chapter/${item.id}` : `/lesson/${item.id}`"
          class="block"
        >
          <UiCard
            class="p-4 transition-colors hover:border-primary/50 flex items-center justify-between"
          >
            <UiCardContent class="p-0 flex items-center justify-between w-full gap-2">
              <span class="flex items-center gap-2 min-w-0">
                <VIcon
                  :name="item.kind === 'chapter' ? 'bi-journal-bookmark' : 'bi-journal-text'"
                  class="size-4 text-primary shrink-0"
                  aria-hidden="true"
                />
                <span class="font-medium truncate">{{ item.title }}</span>
              </span>
              <VIcon
                v-if="item.kind === 'lesson' && !item.is_free"
                name="bi-gem"
                class="size-4 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
            </UiCardContent>
          </UiCard>
        </NuxtLink>
      </div>
    </div>

    <p
      v-else
      class="text-muted-foreground mt-8"
    >
      {{ t('chapter.noLessonsYet') }}
    </p>
  </div>
</template>
