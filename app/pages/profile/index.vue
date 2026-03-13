<script setup lang="ts">
const { t } = useI18n()
useHead(() => ({ title: t('profile.title') }))
</script>

<template>
  <div class="container py-12 px-4">
    <h1 class="text-3xl font-bold">{{ t('profile.title') }}</h1>
    <p class="mt-4 text-muted-foreground">{{ t('profile.body') }}</p>
  </div>
</template>
