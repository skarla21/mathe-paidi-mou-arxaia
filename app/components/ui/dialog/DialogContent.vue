<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DialogContent as RadixContent } from 'radix-vue'
import { cn } from '~/lib/utils'
interface Props { class?: HTMLAttributes['class'] }
const props = defineProps<Props>()
</script>
<template>
  <RadixContent
    :class="cn('fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg sm:rounded-lg', props.class)"
    v-bind="$attrs"
  ><slot /></RadixContent>
</template>
