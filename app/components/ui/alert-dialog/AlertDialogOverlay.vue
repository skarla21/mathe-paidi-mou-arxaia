<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { AlertDialogOverlay } from "radix-vue";
import { cn } from "~/lib/utils";

interface Props {
  class?: HTMLAttributes["class"];
}

const props = defineProps<Props>();
</script>

<template>
  <AlertDialogOverlay
    :class="
      cn(
        'fixed inset-0 z-50 bg-black/80 opacity-0 transition-opacity data-[state=open]:opacity-100',
        props.class,
      )
    "
  />
</template>
