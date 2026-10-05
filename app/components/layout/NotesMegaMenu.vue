<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'desktop' | 'mobile'
}>(), {
  variant: 'desktop',
})

const emit = defineEmits<{
  navigate: []
}>()

const {
  grades,
  loaded,
  failed,
  ensure,
  subjectsForGrade,
  chaptersForSubject,
  ensureChapters,
  isChaptersLoading,
  chaptersFailed,
} = useCatalogNav()

const route = useRoute()
const notesActive = computed(() =>
  route.path === '/notes'
  || route.path.startsWith('/grade/')
  || route.path.startsWith('/category/'),
)

const open = ref(false)
const panelShift = ref(0)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const activeGradeId = ref<string | null>(null)
const activeSubjectId = ref<string | null>(null)
const mobileOpen = ref(false)
const mobileGradeId = ref<string | null>(null)
const mobileSubjectId = ref<string | null>(null)
let closeTimer: ReturnType<typeof setTimeout> | null = null

const activeSubjects = computed(() =>
  activeGradeId.value ? subjectsForGrade(activeGradeId.value) : [],
)
const activeGrade = computed(() => grades.value.find((grade) => grade.id === activeGradeId.value) ?? null)
const activeSubject = computed(() => activeSubjects.value.find((subject) => subject.id === activeSubjectId.value) ?? null)
const activeChapters = computed(() =>
  activeSubjectId.value ? chaptersForSubject(activeSubjectId.value) : [],
)

function clearCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

async function positionPanel() {
  await nextTick()
  const panel = panelRef.value
  if (!panel) return
  panelShift.value = 0
  await nextTick()
  const rect = panel.getBoundingClientRect()
  const margin = 12
  let shift = 0
  if (rect.right > window.innerWidth - margin) {
    shift = window.innerWidth - margin - rect.right
  }
  const left = rect.left + shift
  if (left < margin) shift += margin - left
  panelShift.value = shift
}

function onResize() {
  if (open.value) void positionPanel()
}

function selectGrade(gradeId: string) {
  if (activeGradeId.value === gradeId) return
  activeGradeId.value = gradeId
  activeSubjectId.value = null
}

function selectSubject(subjectId: string) {
  activeSubjectId.value = subjectId
  void ensureChapters(subjectId)
}

function openMenu() {
  clearCloseTimer()
  open.value = true
  void positionPanel()
}

function clearSelection() {
  activeGradeId.value = null
  activeSubjectId.value = null
}

function scheduleClose() {
  clearCloseTimer()
  closeTimer = setTimeout(() => {
    open.value = false
    clearSelection()
    closeTimer = null
  }, 160)
}

function closeMenu() {
  clearCloseTimer()
  open.value = false
  clearSelection()
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget
  if (!(next instanceof Node) || !rootRef.value?.contains(next)) closeMenu()
}

function onNavigate() {
  closeMenu()
  mobileOpen.value = false
  emit('navigate')
}

function toggleMobileGrade(gradeId: string) {
  mobileGradeId.value = mobileGradeId.value === gradeId ? null : gradeId
  mobileSubjectId.value = null
}

async function toggleMobileSubject(subjectId: string) {
  mobileSubjectId.value = mobileSubjectId.value === subjectId ? null : subjectId
  if (mobileSubjectId.value) await ensureChapters(subjectId)
}

watch([activeGradeId, activeSubjectId], () => {
  if (open.value) void positionPanel()
})

onMounted(() => {
  void ensure()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  clearCloseTimer()
  if (import.meta.client) window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div
    v-if="props.variant === 'desktop'"
    ref="rootRef"
    class="relative"
    @mouseenter="openMenu"
    @mouseleave="scheduleClose"
    @focusout="onFocusOut"
    @keydown.escape="closeMenu"
  >
    <button
      type="button"
      class="nav-bobble flex items-center gap-1 px-1 py-1 text-[15px] font-bold"
      :class="notesActive ? 'text-[#10b981] wavy-green' : 'text-muted-foreground hover:text-[#10b981] hover-wavy-green'"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="open ? closeMenu() : openMenu()"
    >
      Σημειώσεις
      <VIcon
        name="bi-chevron-down"
        class="size-3.5 transition-transform duration-200"
        :class="open && 'rotate-180'"
        aria-hidden="true"
      />
    </button>
    <div
      v-show="open"
      ref="panelRef"
      class="absolute top-full left-0 z-50 pt-3"
      :class="activeSubjectId ? 'w-[min(780px,calc(100vw-2rem))]' : activeGradeId ? 'w-[min(36rem,calc(100vw-2rem))]' : 'w-80'"
      :style="panelShift ? { transform: `translateX(${panelShift}px)` } : undefined"
    >
      <div class="flex gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-[0_24px_48px_-12px_rgba(15,23,42,0.18)]">
        <div class="flex min-w-52 flex-1 flex-col gap-1 rounded-xl bg-secondary p-2">
          <span class="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Τάξεις
          </span>
          <NuxtLink
            v-for="grade in grades"
            :key="grade.id"
            :to="`/grade/${grade.slug}`"
            class="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-laurel"
            :class="activeGradeId === grade.id && 'bg-card text-foreground shadow-sm'"
            @mouseenter="selectGrade(grade.id)"
            @focus="selectGrade(grade.id)"
            @click="onNavigate"
          >
            {{ grade.name }}
            <VIcon name="bi-chevron-right" class="size-3.5" aria-hidden="true" />
          </NuxtLink>
          <p v-if="failed && grades.length === 0" class="px-3 py-2 text-sm text-muted-foreground">
            Κάτι πήγε στραβά
          </p>
          <p v-else-if="!loaded && grades.length === 0" class="px-3 py-2 text-sm text-muted-foreground">
            Φόρτωση...
          </p>
          <p v-else-if="grades.length === 0" class="px-3 py-2 text-sm text-muted-foreground">
            Δεν υπάρχουν ακόμη τάξεις.
          </p>
        </div>
        <div v-if="activeGradeId" class="flex min-w-52 flex-1 flex-col gap-1 rounded-xl bg-secondary/60 p-2">
          <span class="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Μαθήματα
          </span>
          <template v-for="subject in activeSubjects" :key="subject.id">
          <NuxtLink
            v-if="activeGrade?.slug && subject.slug"
            :to="`/grade/${activeGrade.slug}/${subject.slug}`"
            class="rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            :class="activeSubjectId === subject.id && 'bg-card shadow-sm'"
            @mouseenter="selectSubject(subject.id)"
            @focus="selectSubject(subject.id)"
            @click="onNavigate"
          >
            {{ subject.name }}
          </NuxtLink>
          </template>
          <p v-if="activeGradeId && activeSubjects.length === 0" class="px-3 py-2 text-sm text-muted-foreground">
            Δεν υπάρχουν ακόμη μαθήματα σε αυτή την τάξη.
          </p>
        </div>
        <div v-if="activeSubjectId" class="flex min-w-52 flex-1 flex-col gap-1 p-2">
          <span class="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Κεφάλαια
          </span>
          <p v-if="activeSubjectId && isChaptersLoading(activeSubjectId)" class="px-3 py-2 text-sm text-muted-foreground">
            Φόρτωση...
          </p>
          <template v-for="chapter in activeChapters" :key="chapter.id">
          <NuxtLink
            v-if="activeGrade?.slug && activeSubject?.slug && chapter.slug"
            :to="`/grade/${activeGrade.slug}/${activeSubject.slug}/${chapter.slug}`"
            class="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary"
            @click="onNavigate"
          >
            {{ chapter.title }}
          </NuxtLink>
          </template>
          <p
            v-if="activeSubjectId && !isChaptersLoading(activeSubjectId) && chaptersFailed(activeSubjectId)"
            class="px-3 py-2 text-sm text-muted-foreground"
          >
            Κάτι πήγε στραβά
          </p>
          <p
            v-else-if="activeSubjectId && !isChaptersLoading(activeSubjectId) && activeChapters.length === 0"
            class="px-3 py-2 text-sm text-muted-foreground"
          >
            Δεν υπάρχουν ακόμη κεφάλαια.
          </p>
        </div>
      </div>
    </div>
  </div>

  <div v-else>
    <button
      type="button"
      class="font-ui flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold transition-colors hover:bg-secondary"
      :class="notesActive ? 'text-[#10b981]' : 'text-muted-foreground hover:text-foreground'"
      :aria-expanded="mobileOpen"
      @click="mobileOpen = !mobileOpen"
    >
      <VIcon name="bi-journal-text" class="size-5 shrink-0" aria-hidden="true" />
      <span class="flex-1 text-left">Σημειώσεις</span>
      <VIcon
        name="bi-chevron-down"
        class="size-4 transition-transform duration-200"
        :class="mobileOpen && 'rotate-180'"
        aria-hidden="true"
      />
    </button>
    <div v-if="mobileOpen" class="ml-4 mt-1 flex flex-col gap-1 border-l border-border pl-3">
      <p v-if="failed && grades.length === 0" class="px-2 py-2 text-sm text-muted-foreground">
        Κάτι πήγε στραβά
      </p>
      <p v-else-if="!loaded && grades.length === 0" class="px-2 py-2 text-sm text-muted-foreground">
        Φόρτωση...
      </p>
      <p v-else-if="grades.length === 0" class="px-2 py-2 text-sm text-muted-foreground">
        Δεν υπάρχουν ακόμη τάξεις.
      </p>
      <div v-for="grade in grades" :key="grade.id">
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
          :aria-expanded="mobileGradeId === grade.id"
          @click="toggleMobileGrade(grade.id)"
        >
          {{ grade.name }}
          <VIcon
            name="bi-chevron-down"
            class="size-3.5 transition-transform"
            :class="mobileGradeId === grade.id && 'rotate-180'"
            aria-hidden="true"
          />
        </button>
        <div v-if="mobileGradeId === grade.id" class="ml-2 flex flex-col gap-1 pb-2">
          <NuxtLink
            v-if="grade.slug"
            :to="`/grade/${grade.slug}`"
            class="rounded-lg px-2 py-1.5 text-sm text-primary hover:bg-secondary"
            @click="onNavigate"
          >
            Άνοιγμα τάξης
          </NuxtLink>
          <div v-for="subject in subjectsForGrade(grade.id)" :key="subject.id">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              :aria-expanded="mobileSubjectId === subject.id"
              @click="toggleMobileSubject(subject.id)"
            >
              {{ subject.name }}
              <VIcon name="bi-chevron-right" class="size-3.5" aria-hidden="true" />
            </button>
            <div v-if="mobileSubjectId === subject.id" class="ml-2 flex flex-col">
              <NuxtLink
                v-if="grade.slug && subject.slug"
                :to="`/grade/${grade.slug}/${subject.slug}`"
                class="rounded-lg px-2 py-1.5 text-sm text-primary hover:bg-secondary"
                @click="onNavigate"
              >
                Άνοιγμα μαθήματος
              </NuxtLink>
              <p v-if="isChaptersLoading(subject.id)" class="px-2 py-1 text-xs text-muted-foreground">
                Φόρτωση...
              </p>
              <p v-else-if="!isChaptersLoading(subject.id) && chaptersFailed(subject.id)" class="px-2 py-1 text-xs text-muted-foreground">
                Κάτι πήγε στραβά
              </p>
              <template v-for="chapter in chaptersForSubject(subject.id)" :key="chapter.id">
              <NuxtLink
                v-if="grade.slug && subject.slug && chapter.slug"
                :to="`/grade/${grade.slug}/${subject.slug}/${chapter.slug}`"
                class="rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                @click="onNavigate"
              >
                {{ chapter.title }}
              </NuxtLink>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
