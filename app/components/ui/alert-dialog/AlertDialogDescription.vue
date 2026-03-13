<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { AlertDialogDescription } from "radix-vue";
import { cn } from "~/lib/utils";

interface Props {
  class?: HTMLAttributes["class"];
}

const props = defineProps<Props>();
</script>

<template>
  <AlertDialogDescription
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </AlertDialogDescription>
</template>
