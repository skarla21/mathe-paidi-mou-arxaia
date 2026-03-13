<script setup lang="ts">
const { toggle, colorMode } = useTheme()
const { t, setLocale, locale } = useI18n()
</script>

<template>
  <!-- Language flags -->
  <div class="flex items-center gap-0.5 rounded-lg bg-muted px-2 py-1.5">
    <button
      type="button"
      class="text-base leading-none px-0.5 transition-opacity"
      :class="locale === 'el' ? 'opacity-100' : 'opacity-30 hover:opacity-70'"
      :aria-label="t('header.languageEl')"
      @click="setLocale('el')"
    >🇬🇷</button>
    <button
      type="button"
      class="text-base leading-none px-0.5 transition-opacity"
      :class="locale === 'en' ? 'opacity-100' : 'opacity-30 hover:opacity-70'"
      :aria-label="t('header.languageEn')"
      @click="setLocale('en')"
    >🇬🇧</button>
  </div>

  <!-- Theme toggle -->
  <button
    type="button"
    class="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5 transition-colors hover:bg-muted/80"
    :aria-label="t('header.toggleTheme')"
    @click="toggle"
  >
    <!-- text-amber-500: decorative sun icon, no --color-warning token in theme -->
    <VIcon name="bi-sun-fill" class="size-3.5 text-amber-500" aria-hidden="true" />
    <div
      class="relative h-4 w-7 rounded-full transition-colors"
      :class="colorMode === 'dark' ? 'bg-primary' : 'bg-border'"
    >
      <!-- bg-background replaces bg-white for semantic theme compatibility -->
      <span
        class="absolute top-0.5 h-3 w-3 rounded-full bg-background shadow-sm transition-transform"
        :class="colorMode === 'dark' ? 'translate-x-3.5' : 'translate-x-0.5'"
      />
    </div>
    <!-- text-blue-400: decorative moon icon, no --color-info token in theme -->
    <VIcon name="bi-moon-fill" class="size-3.5 text-blue-400" aria-hidden="true" />
  </button>
</template>
