<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead(() => ({ title: 'Προφίλ' }))
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-12">
    <LayoutPageIntro title="Προφίλ" lead="Γλώσσα και θέμα." />
  </div>
</template>
