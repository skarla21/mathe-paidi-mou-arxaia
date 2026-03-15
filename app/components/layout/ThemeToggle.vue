<script setup lang="ts">
const { toggle, colorMode } = useTheme()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="colorMode === 'dark'"
    class="rounded-lg bg-muted px-2 py-1.5 flex items-center transition-colors hover:bg-muted/80"
    :aria-label="t('header.toggleTheme')"
    @click="toggle"
  >
    <div
      class="relative h-4 w-7 rounded-full transition-colors"
      :class="colorMode === 'dark' ? 'bg-primary' : 'bg-border'"
    >
      <span
        class="absolute top-0.5 h-3 w-3 rounded-full bg-background shadow-sm transition-transform flex items-center justify-center"
        :class="colorMode === 'dark' ? 'translate-x-3.5' : 'translate-x-0.5'"
      >
        <VIcon
          v-if="colorMode === 'dark'"
          name="bi-moon-fill"
          class="size-2.5 text-blue-400"
          aria-hidden="true"
        />
        <VIcon
          v-else
          name="bi-sun-fill"
          class="size-2.5 text-amber-500"
          aria-hidden="true"
        />
      </span>
    </div>
  </button>
</template>
