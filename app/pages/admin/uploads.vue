<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.uploadsTitle')}` }))
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold">{{ t('admin.uploadsTitle') }}</h1>
    <p class="mt-2 text-muted-foreground">{{ t('admin.uploadsBody') }}</p>
  </div>
</template>
