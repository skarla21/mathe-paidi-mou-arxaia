<script setup lang="ts">
const { t } = useI18n()
const { grades, failed, ensure, subjectsForGrade } = useCatalogNav()

const palettes = [
  { border: 'border-laurel/25', wash: 'bg-laurel-fixed/70', text: 'text-laurel', badge: 'bg-laurel-fixed text-laurel-fixed-foreground', button: 'hover:bg-laurel hover:text-white' },
  { border: 'border-primary/25', wash: 'bg-flame-fixed', text: 'text-primary', badge: 'bg-flame-fixed text-flame-fixed-foreground', button: 'hover:bg-primary hover:text-primary-foreground' },
  { border: 'border-border', wash: 'bg-muted', text: 'text-foreground', badge: 'bg-muted text-foreground', button: 'hover:bg-ink hover:text-background' },
  { border: 'border-amber/40', wash: 'bg-amber/15', text: 'text-amber', badge: 'bg-amber/20 text-foreground', button: 'hover:bg-amber hover:text-white' },
  { border: 'border-amethyst/25', wash: 'bg-amethyst-fixed', text: 'text-amethyst', badge: 'bg-amethyst-fixed text-amethyst-fixed-foreground', button: 'hover:bg-amethyst hover:text-white' },
]

function palette(index: number) {
  return palettes[index % palettes.length]!
}

function subjectLine(gradeId: string) {
  const names = subjectsForGrade(gradeId).map((subject) => subject.name)
  return names.length ? names.join(', ') : t('home.grades.noSubjects')
}

await ensure()
</script>

<template>
  <section id="grades" class="scroll-mt-24 py-16">
    <div class="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <span class="inline-flex rounded-full bg-laurel-fixed px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-laurel-fixed-foreground">
          {{ t('home.grades.eyebrow') }}
        </span>
        <h2 class="mt-2 font-heading text-3xl font-extrabold text-foreground sm:text-4xl">{{ t('home.grades.title') }}</h2>
        <p class="text-muted-foreground">{{ t('home.grades.lead') }}</p>
      </div>
    </div>

    <p v-if="failed && grades.length === 0" class="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
      {{ t('home.grades.error') }}
    </p>
    <p v-else-if="grades.length === 0" class="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
      <span class="block font-heading text-lg font-bold">{{ t('home.grades.empty') }}</span>
      <span class="mt-1 block text-sm text-muted-foreground">{{ t('home.grades.emptyHint') }}</span>
    </p>
    <div v-else id="grades-grid" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="(grade, index) in grades"
        :key="grade.id"
        class="bobble-card flex flex-col justify-between rounded-3xl border bg-card p-5 shadow-sm"
        :class="palette(index).border"
      >
        <div>
          <div class="relative flex h-36 flex-col items-center justify-center overflow-hidden rounded-2xl" :class="palette(index).wash">
            <span class="text-[11px] font-bold uppercase tracking-wider">{{ t('home.grades.level') }}</span>
            <span class="font-heading text-4xl font-extrabold" :class="palette(index).text">{{ grade.name }}</span>
          </div>
          <p class="mt-4 text-sm text-muted-foreground">
            <span class="font-semibold text-foreground">{{ t('home.grades.subjects') }}:</span>
            {{ subjectLine(grade.id) }}
          </p>
        </div>
        <NuxtLink
          :to="`/grade/${grade.id}`"
          class="mt-5 inline-flex items-center justify-center gap-1 rounded-full bg-muted py-2.5 text-sm font-bold text-foreground transition-colors"
          :class="palette(index).button"
        >
          {{ t('home.grades.open') }}
          <VIcon name="bi-arrow-right" class="size-3.5" aria-hidden="true" />
        </NuxtLink>
      </article>
    </div>
  </section>
</template>
