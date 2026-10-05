<script setup lang="ts">
import { legacyGradePath } from '~/utils/legacyGradePath'

const route = useRoute()
const path = legacyGradePath(route.params.path)
if (!path) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: 'Δεν βρέθηκε',
  })
}
await navigateTo({ path, query: route.query }, { redirectCode: 301 })
</script>

<template>
  <div />
</template>
