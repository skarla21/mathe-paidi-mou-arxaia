<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { AlertDialogAction } from "radix-vue";
import { cn } from "~/lib/utils";
interface Props {
  class?: HTMLAttributes["class"];
  asChild?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <AlertDialogAction :as-child="props.asChild" :class="cn(props.class)">
    <slot />
  </AlertDialogAction>
</template>
