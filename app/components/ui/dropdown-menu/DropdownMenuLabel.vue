<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DropdownMenuLabel } from 'radix-vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <DropdownMenuLabel
    :class="cn(
      'px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
      props.class
    )"
  >
    <slot />
  </DropdownMenuLabel>
</template>
