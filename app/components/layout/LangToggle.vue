<script setup lang="ts">
const { t, locale, setLocale } = useI18n()

const open = ref(false)

const langs = [
  { code: 'el' as const, country: 'gr', ariaKey: 'header.languageEl' },
  { code: 'en' as const, country: 'gb', ariaKey: 'header.languageEn' },
]

function select(code: 'el' | 'en') {
  setLocale(code)
  open.value = false
}
</script>

<template>
  <UiPopover v-model:open="open">
    <UiPopoverTrigger as-child>
      <button
        type="button"
        class="rounded-lg bg-muted px-2 py-1.5 flex items-center gap-1 transition-colors hover:bg-muted/80 cursor-pointer"
        :aria-label="locale === 'el' ? t('header.languageEn') : t('header.languageEl')"
      >
        <img
          :src="`https://flagcdn.com/w20/${locale === 'el' ? 'gr' : 'gb'}.png`"
          :srcset="`https://flagcdn.com/w40/${locale === 'el' ? 'gr' : 'gb'}.png 2x`"
          :alt="locale === 'el' ? 'GR' : 'GB'"
          class="w-5 h-auto rounded-sm object-contain"
          aria-hidden="true"
        >
        <VIcon name="bi-chevron-down" class="size-2.5 text-muted-foreground" aria-hidden="true" />
      </button>
    </UiPopoverTrigger>
    <UiPopoverContent align="end" :side-offset="6" class="min-w-0 w-fit p-1.5 rounded-lg shadow-xl border border-border/80 bg-card/95 backdrop-blur-sm">
      <div class="flex flex-col gap-0.5">
        <button
          v-for="lang in langs"
          :key="lang.code"
          type="button"
          class="flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors cursor-pointer min-w-0"
          :class="locale === lang.code
            ? 'bg-accent/50 text-accent-foreground ring-1 ring-primary/30'
            : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'"
          :aria-label="t(lang.ariaKey)"
          @click="select(lang.code)"
        >
          <span class="shrink-0 w-8 flex items-center overflow-hidden rounded-sm">
            <img
              :src="`https://flagcdn.com/w40/${lang.country}.png`"
              :srcset="`https://flagcdn.com/w80/${lang.country}.png 2x`"
              :alt="lang.country.toUpperCase()"
              class="w-8 h-auto object-contain block"
              loading="lazy"
            >
          </span>
          <span class="font-heading text-sm font-medium truncate">
            {{ t(`nav.language${lang.code === 'el' ? 'El' : 'En'}`) }}
          </span>
        </button>
      </div>
    </UiPopoverContent>
  </UiPopover>
</template>
