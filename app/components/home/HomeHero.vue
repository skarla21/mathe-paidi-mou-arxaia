<script setup lang="ts">
const { t } = useI18n()

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <section id="welcome" class="relative scroll-mt-24 py-10 lg:py-16">
    <svg class="pointer-events-none absolute -left-6 top-0 hidden h-36 w-36 text-laurel/30 animate-float-slow md:block" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path d="M10 90 L40 40 L70 90 Z" stroke="currentColor" stroke-width="3" />
      <path d="M50 90 L80 30 L110 90 Z" stroke="currentColor" stroke-width="3" />
      <circle cx="92" cy="24" r="10" class="fill-amber/80" />
    </svg>
    <svg class="pointer-events-none absolute right-2 top-8 hidden h-24 w-24 text-primary/50 animate-float-gentle lg:block" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <rect x="22" y="18" width="36" height="44" rx="8" stroke="currentColor" stroke-width="3" />
      <path d="M30 18v-6h20v6M34 34h16M34 44h12" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-muted/50 via-secondary to-background">
      <div class="absolute -right-16 -top-16 size-72 rounded-full bg-laurel-fixed/50 blur-3xl" />
      <div class="absolute left-0 top-1/2 size-72 rounded-full bg-amethyst-fixed/70 blur-3xl" />
    </div>

    <div class="grid items-center gap-10 lg:grid-cols-12">
      <div class="space-y-6 lg:col-span-7">
        <div id="hero-badge" class="inline-flex items-center gap-2 rounded-full bg-laurel-fixed px-3.5 py-1.5 text-laurel-fixed-foreground shadow-sm">
          <VIcon name="bi-check2-circle" class="size-4" aria-hidden="true" />
          <span class="text-[11px] font-bold uppercase tracking-wider">{{ t('home.hero.badge') }}</span>
        </div>
        <h1 id="hero-title" class="font-heading text-4xl font-extrabold leading-tight tracking-tight text-foreground lg:text-6xl">
          {{ t('home.hero.titleBefore') }}
          <span class="text-primary wavy-underline">{{ t('home.hero.titleAccent') }}</span>
          {{ t('home.hero.titleAfter') }}
        </h1>
        <p id="hero-lead" class="max-w-xl text-lg leading-relaxed text-muted-foreground">
          {{ t('home.hero.lead') }}
        </p>
        <SearchGlobalSearch size="lg" class="max-w-xl" />
        <div id="hero-cta" class="flex flex-wrap items-center gap-4 pt-1">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-600 via-amber-500 to-primary px-8 py-3.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(234,88,12,0.35)] transition-all hover:-translate-y-0.5"
            @click="scrollTo('grades')"
          >
            <VIcon name="bi-book" class="size-4" aria-hidden="true" />
            {{ t('home.hero.ctaExplore') }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-secondary"
            @click="scrollTo('communication')"
          >
            <VIcon name="bi-person" class="size-4 text-primary" aria-hidden="true" />
            {{ t('home.hero.ctaLessons') }}
          </button>
        </div>
      </div>

      <div class="flex justify-center lg:col-span-5">
        <div class="relative w-full max-w-md rounded-3xl bg-card p-6 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
          <div class="relative -mt-14 mb-4 flex justify-center">
            <div class="flex size-24 items-center justify-center rounded-full bg-flame-fixed text-primary shadow-lg ring-4 ring-card">
              <VIcon name="bi-mortarboard" class="size-10" aria-hidden="true" />
            </div>
          </div>
          <div class="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amethyst-fixed px-3 py-1 text-[11px] font-bold text-amethyst-fixed-foreground">
            <VIcon name="bi-mortarboard" class="size-3.5" aria-hidden="true" />
            {{ t('home.hero.tutorEyebrow') }}
          </div>
          <h2 class="mb-4 font-heading text-xl font-bold text-foreground">{{ t('home.hero.tutorTitle') }}</h2>
          <ul class="mb-3 space-y-2.5 rounded-2xl bg-secondary p-4 text-left text-sm">
            <li v-for="key in ['point1', 'point2', 'point3', 'point4']" :key="key" class="flex items-start gap-2.5">
              <VIcon name="bi-check2-circle" class="mt-0.5 size-4 shrink-0 text-laurel" aria-hidden="true" />
              <span class="font-medium">{{ t(`home.hero.${key}`) }}</span>
            </li>
          </ul>
          <div class="flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/10 p-3.5 text-left">
            <VIcon name="bi-lightbulb" class="mt-0.5 size-5 shrink-0 text-amber" aria-hidden="true" />
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-foreground">{{ t('home.hero.tipLabel') }}</p>
              <p class="font-brand text-lg font-bold leading-snug text-foreground">{{ t('home.hero.tip') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
