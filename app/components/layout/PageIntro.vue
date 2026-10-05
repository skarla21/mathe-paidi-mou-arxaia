<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  lead?: string
}>()
</script>

<template>
  <header class="mb-10 max-w-3xl space-y-3">
    <p
      v-if="eyebrow"
      class="inline-flex rounded-full bg-flame-fixed px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-flame-fixed-foreground"
    >
      {{ eyebrow }}
    </p>
    <h1 class="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
      {{ title }}
    </h1>
    <p v-if="lead" class="text-lg leading-relaxed text-muted-foreground">
      {{ lead }}
    </p>
  </header>
</template>
