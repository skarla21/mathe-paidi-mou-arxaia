<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import {
  DropdownMenuPortal,
  DropdownMenuContent as RadixContent,
} from "radix-vue";
import { cn } from "~/lib/utils";

interface Props {
  class?: HTMLAttributes["class"];
  sideOffset?: number;
  align?: "start" | "center" | "end";
}

const props = withDefaults(defineProps<Props>(), {
  sideOffset: 4,
  align: "start",
});
</script>

<template>
  <DropdownMenuPortal>
    <RadixContent
      :side-offset="props.sideOffset"
      :align="props.align"
      :class="
        cn(
          'z-50 min-w-32 overflow-hidden rounded-md border bg-card p-1 text-card-foreground shadow-lg',
          props.class,
        )
      "
    >
      <slot />
    </RadixContent>
  </DropdownMenuPortal>
</template>
