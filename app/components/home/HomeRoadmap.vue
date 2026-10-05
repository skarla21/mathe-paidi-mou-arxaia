<script setup lang="ts">
defineProps<{
  sections: { id: string; label: string; icon: string }[]
  active: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <aside class="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 xl:flex">
    <div class="relative flex flex-col items-center gap-3 rounded-full bg-card/90 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <div class="absolute bottom-4 left-1/2 top-4 -z-10 w-0.5 -translate-x-1/2 rounded-full bg-muted" />
      <a
        v-for="(section, index) in sections"
        :key="section.id"
        :href="`#${section.id}`"
        class="group relative flex size-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
        :class="active === section.id ? 'scale-110 bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'"
        :aria-current="active === section.id ? 'true' : undefined"
        @click.prevent="emit('select', section.id)"
      >
        <VIcon :name="section.icon" class="size-4" aria-hidden="true" />
        <span class="pointer-events-none absolute left-14 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100">
          {{ index + 1 }}. {{ section.label }}
        </span>
      </a>
    </div>
  </aside>
</template>
