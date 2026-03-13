<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'

const route = useRoute()
const gradeId = route.params.grade as string
const subjectId = route.params.subject as string
const { t } = useI18n()

const grade = ref<{ id: string; name: string } | null>(null)
const subject = ref<{ id: string; name: string; grade_id: string } | null>(null)
const courses = ref<any[]>([])

const { data: gradesData } = await useFetch('/api/grades')
const { data: subjectsData } = await useFetch('/api/subjects', { query: { grade_id: gradeId } })
const { data: coursesData } = await useFetch('/api/courses', { query: { subject_id: subjectId } })

grade.value = (gradesData.value as any[])?.find((g: any) => g.id === gradeId) ?? null
subject.value = (subjectsData.value as any[])?.find((s: any) => s.id === subjectId) ?? null
courses.value = (coursesData.value as any[]) ?? []

useHead(() => ({ title: subject.value ? `${subject.value.name} - ${grade.value?.name}` : t('subject.title') }))
</script>

<template>
  <div class="container py-8 px-4">
    <NuxtLink :to="`/grade/${gradeId}`" class="text-sm text-muted-foreground hover:underline">← {{ grade?.name }}</NuxtLink>
    <h1 class="text-3xl font-bold mt-2">{{ subject?.name ?? t('subject.title') }}</h1>
    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="c in courses"
        :key="c.id"
        :to="`/course/${c.id}`"
        class="block"
      >
        <UiCard class="p-4 transition-colors hover:border-primary/50">
          <UiCardContent class="p-0">
            <span class="font-medium">{{ c.title }}</span>
            <span class="text-muted-foreground text-sm ml-2">{{ c.is_free ? t('subject.free') : `€${((c.price || 0) / 100).toFixed(2)}` }}</span>
          </UiCardContent>
        </UiCard>
      </NuxtLink>
    </div>
    <p v-if="courses.length === 0" class="text-muted-foreground">{{ t('subject.noCoursesYet') }}</p>
  </div>
</template>
