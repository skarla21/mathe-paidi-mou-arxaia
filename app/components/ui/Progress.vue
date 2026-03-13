<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  modelValue?: number
  value?: number
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  value: undefined,
  max: 100,
})

const progress = computed(() => props.value ?? props.modelValue)
const percentage = computed(() =>
  Math.min(100, Math.max(0, (progress.value / props.max) * 100))
)
</script>

<template>
  <div
    role="progressbar"
    :aria-valuenow="progress"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', props.class)"
  >
    <div
      class="h-full bg-primary transition-all duration-300 ease-in-out"
      :style="{ width: `${percentage}%` }"
    />
  </div>
</template>
