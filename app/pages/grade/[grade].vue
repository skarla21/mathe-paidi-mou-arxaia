<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiCardHeader from '~/components/ui/CardHeader.vue'
import UiCardTitle from '~/components/ui/CardTitle.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiBadge from '~/components/ui/Badge.vue'

interface Course {
  id: string
  title: string
  is_free: boolean
  subject_id: string
  price: number
}

interface Subject {
  id: string
  name: string
  grade_id: string
}

interface Grade {
  id: string
  name: string
  description?: string | null
  order?: number
}

const route = useRoute()
const gradeId = route.params.grade as string
const { t } = useI18n()

const subjects = ref<Subject[]>([])
const courses = ref<Course[]>([])

const { data: gradeData } = await useFetch(`/api/grades`)
const gradeFromList = computed(() => (gradeData.value as Grade[])?.find((g) => g.id === gradeId))

const { data: subjectsData } = await useFetch('/api/subjects', { query: { grade_id: gradeId } })
subjects.value = (subjectsData.value as Subject[]) ?? []

const { data: coursesData } = await useFetch('/api/courses', { query: { grade_id: gradeId } })
courses.value = (coursesData.value as Course[]) ?? []

function coursesForSubject(subjectId: string) {
  return courses.value.filter((c) => c.subject_id === subjectId)
}

useHead(() => ({
  title: gradeFromList.value ? `${gradeFromList.value.name} - ${t('grade.titleWithName')}` : t('grade.title'),
}))

onMounted(() => {
  if (import.meta.client) {
    const { revealSection } = useGsapReveal()
    nextTick(() => {
      revealSection('#grade-title')
      revealSection('#grade-content')
    })
  }
})
</script>

<template>
  <div class="container py-8 px-4">
    <h1 id="grade-title" class="font-heading text-3xl font-bold">{{ gradeFromList?.name ?? t('grade.title') }}</h1>
    <p class="mt-2 text-muted-foreground">{{ t('grade.subjectsAndCourses') }}</p>
    <div id="grade-content" class="mt-8 space-y-8">
      <section v-for="subj in subjects" :key="subj.id">
        <h2 class="font-heading text-xl font-semibold mb-4">{{ subj.name }}</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <NuxtLink
            v-for="c in coursesForSubject(subj.id)"
            :key="c.id"
            :to="`/course/${c.id}`"
            class="block"
          >
            <UiCard class="group relative rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:scale-[1.02] border-border/80">
              <UiCardHeader class="flex flex-row items-center gap-3 pb-2">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                  <VIcon name="bi-journal-bookmark" class="size-4" />
                </span>
                <UiCardTitle class="font-heading text-base leading-snug">{{ c.title }}</UiCardTitle>
              </UiCardHeader>
              <UiCardContent class="pt-0 pb-4">
                <UiBadge v-if="c.is_free" variant="secondary" class="text-xs">{{ t('grade.free') }}</UiBadge>
                <UiBadge v-else variant="outline" class="text-xs">€{{ (c.price / 100).toFixed(2) }}</UiBadge>
              </UiCardContent>
            </UiCard>
          </NuxtLink>
        </div>
        <p v-if="coursesForSubject(subj.id).length === 0" class="text-muted-foreground text-sm mt-2">
          {{ t('subject.noCoursesYet') }}
        </p>
      </section>
    </div>
    <p v-if="subjects.length === 0" class="text-muted-foreground">{{ t('grade.noSubjectsYet') }}</p>
  </div>
</template>
