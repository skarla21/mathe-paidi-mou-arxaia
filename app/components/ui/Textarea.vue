<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  modelValue?: string
  rows?: number
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const delegated = computed(() => {
  const { class: _, modelValue: __, ...rest } = props
  return rest
})
</script>

<template>
  <textarea
    v-bind="delegated"
    :value="modelValue"
    :rows="rows"
    :class="cn(
      'flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]',
      props.class
    )"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
