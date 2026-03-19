<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiCardHeader from '~/components/ui/CardHeader.vue'
import UiButton from '~/components/ui/Button.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'
import UiBadge from '~/components/ui/Badge.vue'
import { Separator } from '~/components/ui/separator'
import type { AdminStats } from '~/types/database'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
const adminFetch = useAdminFetch()
useHead(() => ({ title: t('admin.statsTitle') }))

const stats = ref<AdminStats | null>(null)
const loading = ref(true)

onMounted(async () => {
  try { stats.value = await adminFetch<AdminStats>('/api/admin/stats') }
  catch {
    stats.value = null
    toast.error(t('common.error'))
  }
  finally { loading.value = false }
})

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return t('common.timeAgo.mins', { n: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('common.timeAgo.hours', { n: hrs })
  return t('common.timeAgo.days', { n: Math.floor(hrs / 24) })
}

function formatRevenue(amount: number) {
  return `€${amount.toLocaleString('el-GR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatMonthlyDelta(value: number, asCurrency = false) {
  return asCurrency ? `+${formatRevenue(value)}` : `+${value}`
}

const kpiCards = computed(() => {
  if (!stats.value) return []
  const s = stats.value as AdminStats & { newLessonsThisMonth?: number }
  return [
    {
      iconLabel: t('admin.stats.cardUsers'),
      icon: 'bi-people',
      total: s.totalUsers,
      monthlyDelta: s.newUsersThisMonth ?? 0,
      monthlyAsCurrency: false,
      sub1: `${s.newUsersThisMonth ?? 0} ${t('admin.stats.newThisMonth')}`,
      sub2: `${s.newUsersThisYear ?? 0} ${t('admin.stats.newThisYear')}`,
    },
    {
      iconLabel: t('admin.stats.cardContent'),
      icon: 'bi-journal-text',
      total: s.totalLessons,
      monthlyDelta: s.newLessonsThisMonth ?? 0,
      monthlyAsCurrency: false,
      sub1: `${s.freeVsPaid?.free ?? 0} ${t('admin.stats.free')} / ${s.freeVsPaid?.paid ?? 0} ${t('admin.stats.paid')}`,
      sub2: null,
    },
    {
      iconLabel: t('admin.stats.cardDownloads'),
      icon: 'bi-download',
      total: s.downloads,
      monthlyDelta: s.downloadsThisMonth ?? 0,
      monthlyAsCurrency: false,
      sub1: `${s.downloadsThisMonth ?? 0} ${t('admin.stats.thisMonth')}`,
      sub2: `${s.downloadsThisYear ?? 0} ${t('admin.stats.thisYear')}`,
    },
    {
      iconLabel: t('admin.stats.cardRevenue'),
      icon: 'bi-currency-euro',
      total: formatRevenue(s.revenue),
      monthlyDelta: s.revenueThisMonth ?? 0,
      monthlyAsCurrency: true,
      sub1: `${formatRevenue(s.revenueThisMonth ?? 0)} ${t('admin.stats.thisMonth')}`,
      sub2: `${formatRevenue(s.revenueThisYear ?? 0)} ${t('admin.stats.thisYear')}`,
    },
  ]
})

const contentCounts = computed(() => {
  if (!stats.value) return []
  const s = stats.value as AdminStats
  return [
    { label: t('admin.stats.totalGrades'), value: s.totalGrades ?? 0, icon: 'bi-mortarboard' },
    { label: t('admin.stats.totalSubjects'), value: s.totalSubjects ?? 0, icon: 'bi-journal-text' },
    { label: t('admin.stats.totalChapters'), value: s.totalChapters ?? 0, icon: 'bi-journal-bookmark' },
    { label: t('admin.stats.totalCategories'), value: s.totalCategories ?? 0, icon: 'bi-folder' },
    { label: t('admin.stats.totalPurchases'), value: s.totalPurchases ?? 0, icon: 'bi-cart' },
  ]
})

const maxLessonsByGrade = computed(() => {
  if (!stats.value?.lessonsByGrade?.length) return 0
  return Math.max(...stats.value.lessonsByGrade.map(g => g.count))
})

const recentUsersPreview = computed(() => (stats.value?.recentUsers ?? []).slice(0, 2))
const recentDownloadsPreview = computed(() => (stats.value?.recentDownloads ?? []).slice(0, 2))
const recentPurchasesPreview = computed(() => (stats.value?.recentPurchases ?? []).slice(0, 2))

const recentColumnEl = ref<HTMLDivElement | null>(null)
const topLessonsMaxHeightPx = ref<number | null>(null)
const topLessonsCardStyle = computed(() => {
  if (topLessonsMaxHeightPx.value == null) return {}
  const h = `${topLessonsMaxHeightPx.value}px`
  return { height: h, maxHeight: h, minHeight: h }
})

let recentColumnResizeObserver: ResizeObserver | null = null

function syncTopLessonsCardMaxHeight() {
  const el = recentColumnEl.value
  if (!el) return
  topLessonsMaxHeightPx.value = Math.round(el.getBoundingClientRect().height)
}

function teardownTopLessonsHeightSync() {
  recentColumnResizeObserver?.disconnect()
  recentColumnResizeObserver = null
  topLessonsMaxHeightPx.value = null
}

watch(
  () => [stats.value, loading.value] as const,
  async ([s, load]) => {
    await nextTick()
    teardownTopLessonsHeightSync()
    if (!s || load) return
    const col = recentColumnEl.value
    if (!col || typeof ResizeObserver === 'undefined') return
    recentColumnResizeObserver = new ResizeObserver(() => syncTopLessonsCardMaxHeight())
    recentColumnResizeObserver.observe(col as unknown as Element)
    syncTopLessonsCardMaxHeight()
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  teardownTopLessonsHeightSync()
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold font-heading">{{ t('admin.statsTitle') }}</h1>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-4">
        <div class="min-w-0 flex-1">
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <UiCard v-for="i in 4" :key="i" class="shadow-md">
              <UiCardContent class="space-y-2 p-3">
                <UiSkeleton class="h-3 w-16" />
                <UiSkeleton class="h-7 w-12" />
                <UiSkeleton class="h-3 w-full" />
              </UiCardContent>
            </UiCard>
          </div>
        </div>
        <UiCard class="shadow-md flex w-full shrink-0 flex-col justify-center lg:max-w-[240px] xl:max-w-[260px]">
          <UiCardContent class="space-y-3 p-4">
            <UiSkeleton class="h-4 w-32" />
            <div class="flex flex-col gap-2">
              <UiSkeleton v-for="j in 4" :key="j" class="h-9 w-full rounded-md" />
            </div>
          </UiCardContent>
        </UiCard>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UiCard v-for="i in 2" :key="i">
          <UiCardContent class="p-5 space-y-3">
            <UiSkeleton class="h-4 w-32" />
            <UiSkeleton v-for="j in 4" :key="j" class="h-4 w-full" />
          </UiCardContent>
        </UiCard>
      </div>
    </template>

    <template v-else-if="stats">
      <!-- KPI Cards + Quick Actions — one row on large screens -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-4">
        <div class="min-w-0 flex-1">
          <div class="grid h-full grid-cols-2 gap-3 md:grid-cols-4 md:gap-3">
            <UiCard v-for="card in kpiCards" :key="card.iconLabel" class="shadow-md flex min-h-0 flex-col">
              <UiCardContent class="flex h-full min-h-0 flex-col p-3 sm:p-3.5">
                <div class="mb-2 flex items-start gap-2">
                  <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:size-10">
                    <VIcon :name="card.icon" class="size-[18px] text-primary sm:size-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-col gap-1">
                      <span class="line-clamp-2 text-xs font-medium leading-snug text-muted-foreground sm:text-sm">{{ card.iconLabel }}</span>
                      <UiBadge
                        class="w-fit border border-emerald-500/30 bg-emerald-500/15 px-2 py-0 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 sm:text-xs"
                      >
                        {{ formatMonthlyDelta(card.monthlyDelta, card.monthlyAsCurrency) }}
                      </UiBadge>
                    </div>
                  </div>
                </div>
                <p class="text-xs text-muted-foreground">{{ t('admin.stats.total') }}</p>
                <p class="text-xl font-bold leading-tight sm:text-2xl">{{ card.total }}</p>
                <div class="mt-auto pt-2">
                  <p class="line-clamp-2 text-xs leading-snug text-muted-foreground">{{ card.sub1 }}</p>
                  <p v-if="card.sub2" class="line-clamp-2 text-xs leading-snug text-muted-foreground">{{ card.sub2 }}</p>
                </div>
              </UiCardContent>
            </UiCard>
          </div>
        </div>
        <UiCard class="shadow-md flex w-full shrink-0 flex-col justify-center lg:max-w-[240px] xl:max-w-[260px]">
          <UiCardContent class="flex flex-col gap-3 p-4 sm:p-4">
            <p class="text-sm font-semibold">{{ t('admin.stats.quickActions') }}</p>
            <div class="flex flex-col gap-2">
              <NuxtLink to="/admin/grades" class="w-full">
                <UiButton variant="outline" size="sm" class="h-9 w-full justify-start">
                  <VIcon name="bi-plus-circle" class="mr-2 size-4 shrink-0" />
                  {{ t('admin.createGrade') }}
                </UiButton>
              </NuxtLink>
              <NuxtLink to="/admin/subjects" class="w-full">
                <UiButton variant="outline" size="sm" class="h-9 w-full justify-start">
                  <VIcon name="bi-plus-circle" class="mr-2 size-4 shrink-0" />
                  {{ t('admin.createSubject') }}
                </UiButton>
              </NuxtLink>
              <NuxtLink to="/admin/chapters" class="w-full">
                <UiButton variant="outline" size="sm" class="h-9 w-full justify-start">
                  <VIcon name="bi-plus-circle" class="mr-2 size-4 shrink-0" />
                  {{ t('admin.createChapter') }}
                </UiButton>
              </NuxtLink>
              <NuxtLink to="/admin/lessons" class="w-full">
                <UiButton variant="outline" size="sm" class="h-9 w-full justify-start">
                  <VIcon name="bi-plus-circle" class="mr-2 size-4 shrink-0" />
                  {{ t('admin.createLesson') }}
                </UiButton>
              </NuxtLink>
            </div>
          </UiCardContent>
        </UiCard>
      </div>

      <!-- Content Overview row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Content Breakdown -->
        <UiCard class="shadow-md">
          <UiCardHeader>
            <p class="font-semibold text-sm">{{ t('admin.stats.contentBreakdown') }}</p>
          </UiCardHeader>
          <UiCardContent class="space-y-3">
            <div v-for="item in contentCounts" :key="item.label" class="flex items-center justify-between">
              <div class="flex items-center gap-2.5 text-sm">
                <VIcon :name="item.icon" class="size-4 text-muted-foreground" />
                <span>{{ item.label }}</span>
              </div>
              <span class="font-semibold text-sm">{{ item.value }}</span>
            </div>
          </UiCardContent>
        </UiCard>

        <!-- Lessons by Grade -->
        <UiCard class="shadow-md">
          <UiCardHeader>
            <p class="font-semibold text-sm">{{ t('admin.stats.lessonsByGrade') }}</p>
          </UiCardHeader>
          <UiCardContent class="space-y-3">
            <div v-if="!stats.lessonsByGrade?.length" class="text-sm text-muted-foreground">—</div>
            <div v-for="g in stats.lessonsByGrade" :key="g.grade" class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span>{{ g.grade }}</span>
                <span class="font-medium">{{ g.count }}</span>
              </div>
              <div class="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary transition-all"
                  :style="{ width: `${maxLessonsByGrade ? (g.count / maxLessonsByGrade * 100) : 0}%` }"
                />
              </div>
            </div>
          </UiCardContent>
        </UiCard>
      </div>

      <Separator />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
        <div ref="recentColumnEl" class="grid grid-cols-1 gap-6">
          <!-- Recent Signups -->
          <UiCard class="shadow-md">
            <UiCardHeader>
              <p class="font-semibold text-sm">{{ t('admin.stats.recentUsers') }}</p>
            </UiCardHeader>
            <UiCardContent>
              <p v-if="!recentUsersPreview.length" class="text-sm text-muted-foreground">{{ t('admin.usersEmpty') }}</p>
              <ul v-else class="space-y-2.5">
                <li v-for="u in recentUsersPreview" :key="u.id" class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2 min-w-0">
                    <img
                      v-if="u.avatar_url"
                      :src="u.avatar_url"
                      :alt="u.name ?? ''"
                      class="size-5 rounded-full object-cover"
                    >
                    <VIcon v-else name="bi-person-circle" class="size-5 text-muted-foreground" />
                    <span class="truncate">{{ u.name ?? u.email ?? t('common.empty') }}</span>
                  </div>
                  <span class="ml-2 shrink-0 text-xs text-muted-foreground">
                    {{ new Date(u.created_at).toLocaleDateString() }}
                  </span>
                </li>
              </ul>
            </UiCardContent>
          </UiCard>

          <!-- Recent Downloads -->
          <UiCard class="shadow-md">
            <UiCardHeader>
              <p class="font-semibold text-sm">{{ t('admin.recentDownloads') }}</p>
            </UiCardHeader>
            <UiCardContent>
              <p v-if="!recentDownloadsPreview.length" class="text-sm text-muted-foreground">{{ t('admin.noDownloads') }}</p>
              <ul v-else class="space-y-2.5">
                <li v-for="d in recentDownloadsPreview" :key="d.id" class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2 min-w-0">
                    <VIcon name="bi-download" class="size-3.5 text-muted-foreground shrink-0" />
                    <span class="truncate">{{ d.users?.name ?? t('common.empty') }}</span>
                  </div>
                  <span class="ml-2 shrink-0 text-xs text-muted-foreground">{{ timeAgo(d.downloaded_at) }}</span>
                </li>
              </ul>
            </UiCardContent>
          </UiCard>

          <!-- Recent Purchases -->
          <UiCard class="shadow-md">
            <UiCardHeader>
              <p class="font-semibold text-sm">{{ t('admin.stats.recentPurchases') }}</p>
            </UiCardHeader>
            <UiCardContent>
              <p v-if="!recentPurchasesPreview.length" class="text-sm text-muted-foreground">{{ t('admin.purchasesEmpty') }}</p>
              <ul v-else class="space-y-2.5">
                <li v-for="p in recentPurchasesPreview" :key="p.id" class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2 min-w-0">
                    <VIcon name="bi-cart" class="size-3.5 text-muted-foreground shrink-0" />
                    <span class="truncate">{{ p.users?.name ?? p.users?.email ?? t('common.empty') }}</span>
                  </div>
                  <UiBadge variant="secondary" class="ml-2 shrink-0 text-xs">
                    {{ p.lessons?.title ?? t('common.empty') }}
                  </UiBadge>
                </li>
              </ul>
            </UiCardContent>
          </UiCard>
        </div>

        <!-- Top Lessons -->
        <UiCard
          class="shadow-md flex min-h-0 min-w-0 flex-col overflow-hidden lg:self-start"
          :style="topLessonsCardStyle"
        >
          <UiCardHeader class="shrink-0">
            <p class="font-semibold text-sm">{{ t('admin.topLessons') }}</p>
          </UiCardHeader>
          <UiCardContent class="min-h-0 flex-1 overflow-y-auto">
            <p v-if="!stats.topLessons.length" class="text-sm text-muted-foreground">{{ t('admin.noDownloads') }}</p>
            <div v-else class="space-y-2">
              <div
                v-for="(l, i) in stats.topLessons"
                :key="l.lesson_id"
                class="flex items-center gap-3 text-sm"
              >
                <span class="text-xs text-muted-foreground w-5 text-right shrink-0">{{ i + 1 }}.</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="truncate font-medium">{{ l.title }}</span>
                    <span class="ml-2 shrink-0 text-xs text-muted-foreground">{{ l.count }}</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      class="h-full rounded-full bg-primary/60 transition-all"
                      :style="{ width: `${stats.topLessons[0]?.count ? (l.count / stats.topLessons[0].count * 100) : 0}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </UiCardContent>
        </UiCard>
      </div>
    </template>
  </div>
</template>
