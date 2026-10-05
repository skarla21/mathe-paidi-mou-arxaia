<script setup lang="ts">
const { t } = useI18n()
const { grades, categories, loaded, failed, ensure, ensureCategories } = useCatalogNav()
const year = new Date().getFullYear()

onMounted(() => {
  void Promise.all([ensure(), ensureCategories()])
})
</script>

<template>
  <footer class="relative mt-16 w-full overflow-hidden border-t border-border bg-secondary pt-16 pb-10">
    <div class="pointer-events-none absolute -bottom-10 -right-8 hidden h-28 w-56 opacity-40 md:block" aria-hidden="true">
      <svg viewBox="0 0 160 80" class="h-full w-full text-primary/30" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 60c20-28 40-28 60 0s40 28 60 0" />
        <path d="M20 20h24v28H20z" />
        <path d="M28 20V8" />
      </svg>
    </div>
    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 md:grid-cols-2 lg:grid-cols-12 lg:px-12">
      <div class="space-y-4 lg:col-span-4">
        <div class="flex items-center gap-2">
          <span class="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <VIcon name="bi-journal-bookmark-fill" class="size-4" aria-hidden="true" />
          </span>
          <span class="font-brand text-lg font-bold text-foreground">{{ t('footer.brand') }}</span>
        </div>
        <p class="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {{ t('footer.tagline') }}
        </p>
        <div class="rounded-2xl bg-muted/80 p-4">
          <p class="font-brand text-lg font-bold leading-snug text-foreground">
            {{ t('footer.quote') }}
          </p>
        </div>
      </div>

      <div class="space-y-3 lg:col-span-2">
        <h2 class="font-heading text-base font-semibold text-foreground">{{ t('nav.grades') }}</h2>
        <ul class="space-y-2 text-sm text-muted-foreground">
          <li v-for="grade in grades" :key="grade.id">
            <NuxtLink :to="`/grade/${grade.id}`" class="transition-colors hover:text-primary">
              {{ grade.name }}
            </NuxtLink>
          </li>
          <li v-if="failed && grades.length === 0">
            <span>{{ t('common.error') }}</span>
          </li>
          <li v-else-if="!loaded && grades.length === 0">
            <span>{{ t('common.loading') }}</span>
          </li>
          <li v-else-if="grades.length === 0">
            <span>{{ t('nav.noGrades') }}</span>
          </li>
        </ul>
      </div>

      <div class="space-y-3 lg:col-span-3">
        <h2 class="font-heading text-base font-semibold text-foreground">{{ t('footer.material') }}</h2>
        <ul class="space-y-2 text-sm text-muted-foreground">
          <li>
            <a href="/#grades" class="transition-colors hover:text-primary">{{ t('home.section.grades') }}</a>
          </li>
          <li>
            <NuxtLink to="/notes" class="transition-colors hover:text-primary">{{ t('nav.allExtras') }}</NuxtLink>
          </li>
          <li v-for="category in categories.slice(0, 4)" :key="category.id">
            <NuxtLink :to="`/category/${category.id}`" class="transition-colors hover:text-primary">
              {{ category.name }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/articles" class="transition-colors hover:text-primary">{{ t('nav.articles') }}</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/about" class="transition-colors hover:text-primary">{{ t('nav.about') }}</NuxtLink>
          </li>
        </ul>
      </div>

      <div class="space-y-3 lg:col-span-3">
        <h2 class="font-heading text-base font-semibold text-foreground">{{ t('footer.contact') }}</h2>
        <p class="text-sm leading-relaxed text-muted-foreground">{{ t('footer.contactText') }}</p>
        <a
          href="/#communication"
          class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {{ t('footer.contactLink') }}
          <VIcon name="bi-arrow-right" class="size-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
    <div class="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-border px-6 pt-6 text-xs text-muted-foreground md:flex-row lg:px-12">
      <p>{{ t('footer.copyright', { year }) }}</p>
    </div>
  </footer>
</template>
