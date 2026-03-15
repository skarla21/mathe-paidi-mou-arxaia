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
        class="rounded-lg bg-muted px-2 py-1.5 flex items-center gap-1 transition-colors hover:bg-muted/80"
        :aria-label="locale === 'el' ? t('header.languageEn') : t('header.languageEl')"
      >
        <img
          :src="`https://flagcdn.com/w20/${locale === 'el' ? 'gr' : 'gb'}.png`"
          :srcset="`https://flagcdn.com/w40/${locale === 'el' ? 'gr' : 'gb'}.png 2x`"
          :alt="locale === 'el' ? 'GR' : 'GB'"
          class="w-5 h-auto rounded-sm"
          aria-hidden="true"
        >
        <VIcon name="bi-chevron-down" class="size-2.5 text-muted-foreground" aria-hidden="true" />
      </button>
    </UiPopoverTrigger>
    <UiPopoverContent align="end" :side-offset="6" class="w-auto p-2">
      <div class="flex gap-2">
        <button
          v-for="lang in langs"
          :key="lang.code"
          type="button"
          class="flex size-8 items-center justify-center rounded-md text-xl transition-opacity"
          :class="locale === lang.code ? 'ring-2 ring-primary' : 'opacity-50 hover:opacity-80'"
          :aria-label="t(lang.ariaKey)"
          @click="select(lang.code)"
        >
          <img
            :src="`https://flagcdn.com/w40/${lang.country}.png`"
            :srcset="`https://flagcdn.com/w80/${lang.country}.png 2x`"
            :alt="lang.country.toUpperCase()"
            class="w-6 h-auto rounded-sm"
          >
        </button>
      </div>
    </UiPopoverContent>
  </UiPopover>
</template>
