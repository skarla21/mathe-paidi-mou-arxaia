<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiCardHeader from '~/components/ui/CardHeader.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: t('admin.statsTitle') }))

const stats = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try { stats.value = await $fetch<any>('/api/admin/stats') }
  catch { /* render empty */ }
  finally { loading.value = false }
})

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold font-heading">{{ t('admin.statsTitle') }}</h1>
    <p v-if="loading" class="text-muted-foreground">{{ t('common.loading') }}</p>
    <template v-else-if="stats">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <UiCard
v-for="card in [
          { label: t('admin.stats.totalUsers'), value: stats.totalUsers, icon: 'bi-people' },
          { label: t('admin.stats.totalLessons'), value: stats.totalLessons, icon: 'bi-journal-text' },
          { label: t('admin.stats.downloads'), value: stats.downloads, icon: 'bi-download' },
          { label: t('admin.stats.revenue'), value: `€${stats.revenue}`, icon: 'bi-currency-euro' },
        ]" :key="card.label">
          <UiCardContent class="flex items-center gap-4 p-5">
            <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <VIcon :name="card.icon" class="size-5 text-primary" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ card.value }}</p>
              <p class="text-xs text-muted-foreground">{{ card.label }}</p>
            </div>
          </UiCardContent>
        </UiCard>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UiCard>
          <UiCardHeader><p class="font-semibold">{{ t('admin.recentDownloads') }}</p></UiCardHeader>
          <UiCardContent>
            <p v-if="!stats.recentDownloads.length" class="text-sm text-muted-foreground">{{ t('admin.noDownloads') }}</p>
            <ul v-else class="space-y-2">
              <li v-for="d in stats.recentDownloads" :key="d.id" class="flex items-center justify-between text-sm">
                <span class="truncate">{{ d.users?.name ?? '—' }} — {{ d.lessons?.title ?? '—' }}</span>
                <span class="ml-2 shrink-0 text-xs text-muted-foreground">{{ timeAgo(d.downloaded_at) }}</span>
              </li>
            </ul>
          </UiCardContent>
        </UiCard>
        <UiCard>
          <UiCardHeader><p class="font-semibold">{{ t('admin.topLessons') }}</p></UiCardHeader>
          <UiCardContent>
            <p v-if="!stats.topLessons.length" class="text-sm text-muted-foreground">{{ t('admin.noDownloads') }}</p>
            <ul v-else class="space-y-2">
              <li v-for="(l, i) in stats.topLessons" :key="l.lesson_id" class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground w-4">{{ (i as number) + 1 }}.</span>
                  <span class="truncate">{{ l.title }}</span>
                </span>
                <span class="ml-2 shrink-0 font-medium">{{ l.count }}</span>
              </li>
            </ul>
          </UiCardContent>
        </UiCard>
      </div>
    </template>
  </div>
</template>
