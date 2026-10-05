<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'
import { NuxtLink } from '#components'

definePageMeta({ layout: 'default' })
const { t } = useI18n()
useHead(() => ({ title: t('articlesPage.title') }))

type Row = {
  id: string
  title: string
  tags: string[]
  reading_time_minutes: number
  created_at: string
}

const list = ref<Row[] | null>(null)

onMounted(async () => {
  try {
    list.value = await $fetch<Row[]>('/api/articles', { credentials: 'include' })
  } catch {
    list.value = []
    toast.error(t('common.error'))
  }
})
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-12">
    <LayoutPageIntro :eyebrow="t('nav.extras')" :title="t('articlesPage.title')" />

    <div v-if="list === null" class="space-y-4">
      <UiCard v-for="i in 4" :key="i">
        <UiCardContent class="p-6">
          <UiSkeleton class="h-6 w-2/3 mb-2" />
          <UiSkeleton class="h-4 w-24" />
        </UiCardContent>
      </UiCard>
    </div>

    <p v-else-if="!list.length" class="text-muted-foreground">{{ t('articlesPage.empty') }}</p>

    <ul v-else class="space-y-4">
      <li v-for="a in list" :key="a.id">
        <UiCard class="rounded-3xl shadow-sm transition-shadow hover:shadow-md">
          <UiCardContent class="p-6">
            <NuxtLink :to="`/articles/${a.id}`" class="block group">
              <h2 class="text-xl font-heading font-semibold group-hover:text-primary transition-colors">
                {{ a.title }}
              </h2>
              <p class="text-sm text-muted-foreground mt-2">
                {{ t('articlesPage.readTime', { n: a.reading_time_minutes }) }}
              </p>
              <div v-if="a.tags?.length" class="flex flex-wrap gap-2 mt-3">
                <span
                  v-for="tag in a.tags"
                  :key="tag"
                  class="text-xs rounded-md bg-muted px-2 py-0.5 text-muted-foreground"
                >
                  {{ tag }}
                </span>
              </div>
            </NuxtLink>
          </UiCardContent>
        </UiCard>
      </li>
    </ul>
  </div>
</template>
