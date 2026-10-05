<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { t } = useI18n()
useHead(() => ({ title: t('profile.title') }))
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-12">
    <LayoutPageIntro :title="t('profile.title')" :lead="t('profile.body')" />
  </div>
</template>
