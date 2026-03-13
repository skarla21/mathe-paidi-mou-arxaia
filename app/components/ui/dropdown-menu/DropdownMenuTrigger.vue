<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DropdownMenuTrigger } from 'radix-vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  asChild?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  asChild: false,
  disabled: false,
})
</script>

<template>
  <DropdownMenuTrigger
    :as-child="props.asChild"
    :disabled="props.disabled"
    :class="cn(
      'flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      props.class
    )"
  >
    <slot />
  </DropdownMenuTrigger>
</template>
