<script setup lang="ts">
import { AlertDialogRoot } from "radix-vue";
</script>

<template>
  <AlertDialogRoot v-bind="$attrs">
    <slot />
  </AlertDialogRoot>
</template>
