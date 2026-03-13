<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiCardHeader from '~/components/ui/CardHeader.vue'
import UiCardTitle from '~/components/ui/CardTitle.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'
import UiBadge from '~/components/ui/Badge.vue'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
useHead(() => ({ title: t('dashboard.title') }))

const { data: purchasesData, pending } = await useFetch<
  { id: string; title: string; is_free: boolean; price: number }[]
>('/api/user/purchases')

const courses = computed(() => purchasesData.value ?? [])

onMounted(() => {
  if (import.meta.client) {
    const { revealSection } = useGsapReveal()
    nextTick(() => {
      revealSection('#dashboard-title')
    })
  }
})
</script>

<template>
  <div class="container py-12 px-4 max-w-5xl">
    <!-- Page header -->
    <div id="dashboard-title" class="mb-8">
      <h1 class="font-heading text-3xl font-bold">{{ t('dashboard.title') }}</h1>
      <p class="mt-2 text-muted-foreground font-heading">{{ t('dashboard.body') }}</p>
    </div>

    <!-- My Courses section -->
    <section>
      <h2 class="font-heading text-xl font-semibold mb-4">{{ t('dashboard.myCourses') }}</h2>

      <!-- Skeleton loading -->
      <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UiSkeleton v-for="i in 3" :key="i" class="h-28 rounded-xl" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="courses.length === 0"
        class="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center max-w-md"
      >
        <VIcon name="bi-cart" class="size-10 mx-auto text-muted-foreground/70" aria-hidden="true" />
        <p class="mt-3 font-heading font-medium">{{ t('dashboard.empty') }}</p>
        <p class="mt-1 text-sm text-muted-foreground">{{ t('dashboard.emptyHint') }}</p>
        <NuxtLink
          to="/"
          class="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {{ t('dashboard.emptyCta') }}
        </NuxtLink>
      </div>

      <!-- Course grid -->
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="c in courses"
          :key="c.id"
          :to="`/course/${c.id}`"
          class="block group"
        >
          <UiCard class="rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:scale-[1.02] border-border/80">
            <UiCardHeader class="flex flex-row items-center gap-3 pb-2">
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <VIcon name="bi-journal-bookmark" class="size-4" />
              </span>
              <UiCardTitle class="font-heading text-base leading-snug">{{ c.title }}</UiCardTitle>
            </UiCardHeader>
            <UiCardContent class="pt-0 pb-4">
              <UiBadge variant="secondary" class="text-xs">
                {{ c.is_free ? t('course.free') : `€${(c.price / 100).toFixed(2)}` }}
              </UiBadge>
            </UiCardContent>
          </UiCard>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
