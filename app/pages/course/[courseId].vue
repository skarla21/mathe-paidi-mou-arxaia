<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'
import UiCard from '~/components/ui/Card.vue'

interface Course {
  id: string
  title: string
  description?: string | null
  is_free: boolean
  price?: number | null
  subject_id?: string
}

interface Lesson {
  id: string
  title: string
  is_free: boolean
  course_id: string
}

const route = useRoute()
const courseId = route.params.courseId as string
const { t } = useI18n()

const course = ref<Course | null>(null)
const lessons = ref<Lesson[]>([])
const purchasing = ref(false)

const { data: courseData } = await useFetch(`/api/courses/${courseId}`)
const { data: lessonsData } = await useFetch(`/api/lessons`, { query: { course_id: courseId } })

course.value = courseData.value as Course | null
lessons.value = (lessonsData.value as Lesson[]) ?? []

async function buyCourse() {
  purchasing.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/checkout', {
      method: 'POST',
      body: { courseId },
    })
    if (url) window.location.href = url
  } catch (e: any) {
    toast.error(e?.data?.message ?? t('course.checkoutError'))
  } finally {
    purchasing.value = false
  }
}

useHead(() => ({ title: course.value ? course.value.title : t('course.title') }))

onMounted(() => {
  if (import.meta.client) {
    const { revealSection } = useGsapReveal()
    nextTick(() => {
      revealSection('#course-title')
      revealSection('#course-lessons')
    })
  }
})
</script>

<template>
  <div class="container py-8 px-4">
    <div v-if="!course" class="space-y-4">
      <UiSkeleton class="h-9 w-2/3 rounded-xl" />
      <UiSkeleton class="h-5 w-full rounded-lg" />
      <UiSkeleton class="h-5 w-1/3 rounded-lg" />
      <UiSkeleton class="h-10 w-32 rounded-xl mt-4" />
      <UiSkeleton class="h-7 w-40 rounded-lg mt-8" />
      <div class="space-y-2 mt-4">
        <UiSkeleton class="h-5 w-3/4 rounded-lg" />
        <UiSkeleton class="h-5 w-2/3 rounded-lg" />
        <UiSkeleton class="h-5 w-1/2 rounded-lg" />
      </div>
    </div>
    <template v-else>
      <h1 id="course-title" class="font-heading text-3xl font-bold">{{ course.title }}</h1>
      <p class="mt-2 text-muted-foreground">{{ course.description }}</p>
      <p class="mt-2">
        <span class="font-medium">{{ course.is_free ? t('course.free') : `€${((course.price || 0) / 100).toFixed(2)}` }}</span>
      </p>
      <div v-if="!course.is_free" class="mt-4">
        <UiButton :disabled="purchasing" @click="buyCourse">
          {{ purchasing ? t('course.redirecting') : t('course.buy') }}
        </UiButton>
      </div>
      <h2 id="course-lessons" class="font-heading text-xl font-semibold mt-8">{{ t('course.lessons') }}</h2>
      <div class="space-y-3 mt-4">
        <NuxtLink v-for="l in lessons" :key="l.id" :to="`/lesson/${l.id}`">
          <UiCard class="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
            <span class="font-medium text-foreground">{{ l.title }}</span>
            <VIcon v-if="!l.is_free" name="bi-gem" class="size-4 text-muted-foreground" aria-hidden="true" />
          </UiCard>
        </NuxtLink>
      </div>
      <p v-if="lessons.length === 0" class="text-muted-foreground">{{ t('course.noLessonsYet') }}</p>
    </template>
  </div>
</template>
