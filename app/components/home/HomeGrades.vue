<script setup lang="ts">
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
  return names.length ? names.join(', ') : 'Θα εμφανιστούν μόλις προστεθούν'
}

await ensure()
</script>

<template>
  <section id="grades" class="scroll-mt-24 py-16">
    <div class="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <span class="inline-flex rounded-full bg-laurel-fixed px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-laurel-fixed-foreground">
          Οργάνωση ανά τάξη
        </span>
        <h2 class="mt-2 font-heading text-3xl font-extrabold text-foreground sm:text-4xl">Διάλεξε την τάξη σου</h2>
        <p class="text-muted-foreground">Σημειώσεις και κεφάλαια ανά βαθμίδα, όπως τα έχει οργανώσει η διδάσκουσα.</p>
      </div>
    </div>

    <p v-if="failed && grades.length === 0" class="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
      Οι τάξεις δεν φορτώθηκαν. Δοκίμασε ξανά σε λίγο.
    </p>
    <p v-else-if="grades.length === 0" class="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
      <span class="block font-heading text-lg font-bold">Δεν υπάρχουν ακόμη διαθέσιμες τάξεις.</span>
      <span class="mt-1 block text-sm text-muted-foreground">Οι τάξεις θα εμφανίζονται εδώ μόλις προστεθούν.</span>
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
            <span class="text-[11px] font-bold uppercase tracking-wider">Τάξη</span>
            <span class="font-heading text-4xl font-extrabold" :class="palette(index).text">{{ grade.name }}</span>
          </div>
          <p class="mt-4 text-sm text-muted-foreground">
            <span class="font-semibold text-foreground">Μαθήματα:</span>
            {{ subjectLine(grade.id) }}
          </p>
        </div>
        <NuxtLink
          :to="`/grade/${grade.slug}`"
          class="mt-5 inline-flex items-center justify-center gap-1 rounded-full bg-muted py-2.5 text-sm font-bold text-foreground transition-colors"
          :class="palette(index).button"
        >
          Άνοιγμα ύλης
          <VIcon name="bi-arrow-right" class="size-3.5" aria-hidden="true" />
        </NuxtLink>
      </article>
    </div>
  </section>
</template>
