<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { DropdownMenuItem } from "radix-vue";
import { cn } from "~/lib/utils";

interface Props {
  class?: HTMLAttributes["class"];
  disabled?: boolean;
  inset?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  inset: false,
});
</script>

<template>
  <DropdownMenuItem
    :disabled="props.disabled"
    :inset="props.inset"
    :class="
      cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-4 py-2 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted data-[highlighted]:bg-muted data-disabled:pointer-events-none data-disabled:opacity-50',
        '[&>a]:block [&>a]:w-full [&>a]:no-underline [&>a]:text-inherit',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuItem>
</template>
