<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { PopoverAnchor } from 'radix-vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  asChild?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  asChild: false,
})
</script>

<template>
  <PopoverAnchor :as-child="props.asChild" :class="cn(props.class)">
    <slot />
  </PopoverAnchor>
</template>
