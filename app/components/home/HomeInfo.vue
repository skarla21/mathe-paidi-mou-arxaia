<script setup lang="ts">
const { t } = useI18n()

const cards = [
  { icon: 'bi-list-check', tint: 'bg-laurel-fixed text-laurel-fixed-foreground', linkClass: 'text-laurel', title: 'home.info.card1Title', body: 'home.info.card1Body', link: 'home.info.card1Link', href: '/about' },
  { icon: 'bi-shield-check', tint: 'bg-flame-fixed text-flame-fixed-foreground', linkClass: 'text-primary', title: 'home.info.card2Title', body: 'home.info.card2Body', link: 'home.info.card2Link', href: '#grades' },
  { icon: 'bi-people', tint: 'bg-amethyst-fixed text-amethyst-fixed-foreground', linkClass: 'text-amethyst', title: 'home.info.card3Title', body: 'home.info.card3Body', link: 'home.info.card3Link', href: '/about' },
]
</script>

<template>
  <section id="information" class="scroll-mt-24 py-16">
    <div class="mx-auto mb-12 max-w-3xl space-y-3 text-center">
      <span class="inline-flex rounded-full bg-amethyst-fixed px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amethyst-fixed-foreground">
        {{ t('home.info.eyebrow') }}
      </span>
      <h2 class="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">{{ t('home.info.title') }}</h2>
      <p class="text-muted-foreground">{{ t('home.info.lead') }}</p>
    </div>
    <div id="info-grid" class="grid gap-6 md:grid-cols-3">
      <article
        v-for="card in cards"
        :key="card.title"
        class="group flex flex-col justify-between rounded-3xl bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
      >
        <div>
          <div class="mb-6 flex size-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110" :class="card.tint">
            <VIcon :name="card.icon" class="size-6" aria-hidden="true" />
          </div>
          <h3 class="mb-3 font-heading text-xl font-bold">{{ t(card.title) }}</h3>
          <p class="leading-relaxed text-muted-foreground">{{ t(card.body) }}</p>
        </div>
        <NuxtLink :to="card.href" class="mt-6 inline-flex items-center gap-1 text-sm font-bold transition-transform group-hover:translate-x-1" :class="card.linkClass">
          {{ t(card.link) }}
          <VIcon name="bi-arrow-right" class="size-3.5" aria-hidden="true" />
        </NuxtLink>
      </article>
    </div>
  </section>
</template>
