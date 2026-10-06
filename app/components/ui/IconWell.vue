<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "~/lib/utils";

interface Props {
  class?: HTMLAttributes["class"];
  tone?: "amethyst" | "destructive";
}

const props = withDefaults(defineProps<Props>(), {
  tone: "amethyst",
});
</script>

<template>
  <span
    :class="
      cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full',
        props.tone === 'destructive'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-amethyst-fixed text-amethyst',
        props.class,
      )
    "
  >
    <slot />
  </span>
</template>
