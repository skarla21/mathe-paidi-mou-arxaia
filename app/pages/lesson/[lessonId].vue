<script setup lang="ts">
import { toast } from 'vue-sonner'
import LessonContentViewer from '~/components/lesson/LessonContentViewer.vue'
import UiButton from '~/components/ui/Button.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'

interface Lesson {
  id: string
  title: string
  content?: string | null
  is_free: boolean
  price: number
  content_url?: string | null
}

interface LessonResponse extends Lesson {
  can_access: boolean
  can_access_content: boolean
  has_content?: boolean
}

const route = useRoute()
const lessonId = route.params.lessonId as string
const { t } = useI18n()

const lesson = ref<Lesson | null>(null)
const canAccess = ref(false)
const canAccessContent = ref(false)
const hasContent = ref(false)
const purchasing = ref(false)

const { data } = await useFetch<LessonResponse>(`/api/lessons/${lessonId}`)
if (data.value) {
  const { can_access, can_access_content, has_content, ...rest } = data.value
  lesson.value = rest
  canAccess.value = can_access
  canAccessContent.value = can_access_content
  hasContent.value = Boolean(has_content)
}

const safeContent = ref('')

watch(
  () => lesson.value?.content,
  async (html) => {
    if (!import.meta.client || !html) {
      safeContent.value = ''
      return
    }
    const DOMPurify = (await import('dompurify')).default
    safeContent.value = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre'],
    })
  },
  { immediate: true }
)

async function buyLesson() {
  purchasing.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/checkout', {
      method: 'POST',
      body: { lessonId },
    })
    if (url) window.location.href = url
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? t('lesson.checkoutError'))
  } finally {
    purchasing.value = false
  }
}

useHead(() => ({
  title: lesson.value ? lesson.value.title : t('lesson.title'),
}))

onMounted(() => {
  if (import.meta.client) {
    const { revealSection } = useGsapReveal()
    nextTick(() => {
      revealSection('#lesson-title')
    })
  }
})
</script>

<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-12">
    <div v-if="!lesson" class="space-y-4">
      <UiSkeleton class="h-9 w-2/3 rounded-xl" />
      <UiSkeleton class="h-5 w-full rounded-lg" />
      <UiSkeleton class="h-5 w-4/5 rounded-lg" />
      <UiSkeleton class="h-64 w-full rounded-xl mt-8" />
    </div>
    <template v-else>
      <div id="lesson-title">
        <LayoutPageIntro :title="lesson.title" />
      </div>
      <ClientOnly v-if="lesson.content">
        <div
          v-if="safeContent"
          class="font-reading prose mt-4 max-w-none dark:prose-invert"
          v-html="safeContent"
        />
        <template #fallback>
          <div class="mt-4 h-64 animate-pulse rounded-xl bg-muted" />
        </template>
      </ClientOnly>
      <div v-if="canAccess && canAccessContent && lesson.content_url" class="mt-8">
        <LessonContentViewer :src="lesson.content_url" :lesson-id="lessonId" />
      </div>
      <div
        v-else-if="canAccess && !canAccessContent && hasContent"
        class="mt-8 flex max-w-md flex-col items-center gap-4 rounded-3xl border border-amber/30 bg-amber/10 p-8 text-center"
      >
        <span
          class="flex size-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-500"
        >
          <VIcon name="bi-envelope-exclamation" class="size-7" aria-hidden="true" />
        </span>
        <div>
          <h3 class="font-heading text-xl font-bold text-foreground">
            {{ t('lesson.verifyToAccessContent') }}
          </h3>
          <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
            {{ t('lesson.verifyToAccessContentDescription') }}
          </p>
        </div>
        <NuxtLink to="/profile/edit">
          <UiButton variant="outline">
            {{ t('nav.editProfile') }}
          </UiButton>
        </NuxtLink>
      </div>
      <div
        v-else-if="hasContent && !canAccess"
        class="mt-8 flex max-w-md flex-col items-center gap-4 rounded-3xl border border-primary/30 bg-flame-fixed/40 p-8 text-center"
      >
        <span
          class="flex size-14 items-center justify-center rounded-2xl bg-accent/20 text-accent"
        >
          <VIcon name="bi-gem" class="size-7" aria-hidden="true" />
        </span>
        <div>
          <h3 class="font-heading text-xl font-bold text-foreground">
            {{ t('lesson.paywall.title') }}
          </h3>
          <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
            {{ t('lesson.paywall.description') }}
          </p>
        </div>
        <UiButton :disabled="purchasing" @click="buyLesson">
          {{ purchasing ? t('lesson.redirecting') : t('lesson.paywall.cta') }}
        </UiButton>
      </div>
    </template>
  </div>
</template>
