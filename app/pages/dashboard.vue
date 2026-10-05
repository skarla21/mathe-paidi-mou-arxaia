<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiCardHeader from '~/components/ui/CardHeader.vue'
import UiCardTitle from '~/components/ui/CardTitle.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
useHead(() => ({ title: t('dashboard.title') }))

const { data: purchasesData, pending } = await useFetch<
  { id: string; title: string; is_free: boolean; price: number }[]
>('/api/user/purchases')

const lessons = computed(() => purchasesData.value ?? [])

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
  <div class="mx-auto w-full max-w-5xl px-4 py-12">
    <div id="dashboard-title">
      <LayoutPageIntro :title="t('dashboard.title')" :lead="t('dashboard.body')" />
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
        v-else-if="lessons.length === 0"
        class="max-w-md rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-sm"
      >
        <VIcon name="bi-cart" class="size-10 mx-auto text-muted-foreground/70" aria-hidden="true" />
        <p class="mt-3 font-heading font-medium">{{ t('dashboard.empty') }}</p>
        <p class="mt-1 text-sm text-muted-foreground">{{ t('dashboard.emptyHint') }}</p>
        <NuxtLink
          to="/"
          class="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {{ t('dashboard.emptyCta') }}
        </NuxtLink>
      </div>

      <!-- Content grid -->
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="c in lessons"
          :key="c.id"
          :to="`/lesson/${c.id}`"
          class="block group"
        >
          <UiCard class="bobble-card rounded-3xl border-border/80 shadow-sm transition-shadow hover:shadow-md">
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
              <span class="text-xs text-muted-foreground">
                {{ c.is_free ? t('lesson.free') : `€${(c.price / 100).toFixed(2)}` }}
              </span>
            </UiCardContent>
          </UiCard>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
