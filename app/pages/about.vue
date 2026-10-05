<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()
useHead(() => ({ title: t('about.title') }))

onMounted(() => {
  if (import.meta.client) {
    const { revealSection } = useGsapReveal()
    nextTick(() => {
      revealSection('#about-title')
      revealSection('#about-mission')
      revealSection('#about-platform')
      revealSection('#about-contact')
    })
  }
})
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
    <div id="about-title">
      <LayoutPageIntro :title="t('about.title')" :lead="t('about.hero.lead')" />
    </div>

    <!-- Mission section -->
    <section id="about-mission" class="mb-10">
      <h2 class="font-heading text-2xl font-semibold flex items-center gap-2 mb-4">
        <span class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <VIcon name="bi-stars" class="size-4" aria-hidden="true" />
        </span>
        {{ t('about.mission.title') }}
      </h2>
      <p class="text-muted-foreground leading-relaxed font-heading">{{ t('about.mission.body') }}</p>
    </section>

    <!-- What we offer section -->
    <section id="about-platform" class="mb-10">
      <h2 class="font-heading text-2xl font-semibold flex items-center gap-2 mb-4">
        <span class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <VIcon name="bi-journal-bookmark" class="size-4" aria-hidden="true" />
        </span>
        {{ t('about.platform.title') }}
      </h2>
      <ul class="space-y-3">
        <li
          v-for="key in ['bullet1', 'bullet2', 'bullet3']"
          :key="key"
          class="flex items-start gap-3"
        >
          <span class="mt-0.5 shrink-0 text-primary">
            <VIcon name="bi-check2-circle" class="size-5" />
          </span>
          <span class="text-muted-foreground leading-relaxed font-heading">
            {{ t(`about.platform.${key}`) }}
          </span>
        </li>
      </ul>
    </section>

    <!-- Contact section -->
    <section id="about-contact" class="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h2 class="font-heading text-xl font-semibold flex items-center gap-2 mb-3">
        <VIcon name="bi-chat-dots" class="size-5 text-primary" aria-hidden="true" />
        {{ t('about.contact.title') }}
      </h2>
      <p class="text-muted-foreground font-heading mb-4">{{ t('about.contact.body') }}</p>
      <NuxtLink
        to="/#communication"
        class="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <VIcon name="bi-envelope" class="size-4" aria-hidden="true" />
        {{ t('about.contact.link') }}
      </NuxtLink>
    </section>

  </div>
</template>
