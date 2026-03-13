<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { AlertDialogCancel } from "radix-vue";
import { cn } from "~/lib/utils";

interface Props {
  class?: HTMLAttributes["class"];
  asChild?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <AlertDialogCancel :as-child="props.asChild" :class="cn(props.class)">
    <slot />
  </AlertDialogCancel>
</template>
