<script setup lang="ts">
import { NuxtLink } from '#components'

const { t } = useI18n()
const { grades, subjects, ensure } = useGradesData()
const open = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

function subjectsForGrade(gradeId: string) {
  return subjects.value.filter((s) => s.grade_id === gradeId)
}

function gradeSlug(grade: { id: string }) {
  return grade.id
}

function onMouseEnter() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  open.value = true
}

function onMouseLeave() {
  closeTimer = setTimeout(() => {
    open.value = false
    closeTimer = null
  }, 150)
}

onMounted(ensure)
</script>

<template>
  <div
    class="relative"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <button
      type="button"
      class="font-heading flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground nav-link-underline transition-colors cursor-pointer py-1"
      :aria-expanded="open"
      aria-haspopup="menu"
    >
      <VIcon name="bi-journal-text" class="size-4" aria-hidden="true" />
      {{ t('nav.notes') }}
      <VIcon name="bi-chevron-down" class="size-3.5 text-muted-foreground transition-transform duration-200" :class="open && 'rotate-180'" aria-hidden="true" />
    </button>
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-show="open"
        class="absolute left-1/2 top-full -translate-x-1/2 z-50 mt-1 min-w-56 overflow-hidden rounded-lg border border-border bg-card py-2 shadow-lg"
      >
        <template v-for="grade in grades" :key="grade.id">
          <p class="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {{ grade.name }}
          </p>
          <NuxtLink
            v-for="subj in subjectsForGrade(grade.id)"
            :key="subj.id"
            :to="`/grade/${gradeSlug(grade)}/${subj.id}`"
            class="block px-4 py-2 text-sm hover:bg-accent transition-colors"
            @click="open = false"
          >
            {{ subj.name }}
          </NuxtLink>
        </template>
        <p
          v-if="grades.length === 0"
          class="px-4 py-2 text-sm text-muted-foreground"
        >
          {{ t('notes.empty') }}
        </p>
      </div>
    </Transition>
  </div>
</template>
