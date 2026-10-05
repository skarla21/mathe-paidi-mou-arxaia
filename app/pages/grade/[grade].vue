<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiCardHeader from '~/components/ui/CardHeader.vue'
import UiCardTitle from '~/components/ui/CardTitle.vue'
import UiCardContent from '~/components/ui/CardContent.vue'

interface Chapter {
  id: string
  title: string
  subject_id: string
}

interface Subject {
  id: string
  name: string
  grade_id: string
}

interface Grade {
  id: string
  name: string
  description?: string | null
  order?: number
}

const route = useRoute()
const gradeId = route.params.grade as string

const subjects = ref<Subject[]>([])
const chapters = ref<Chapter[]>([])

const { data: gradeData } = await useFetch('/api/grades')
const gradeFromList = computed(() => (gradeData.value as Grade[])?.find((g) => g.id === gradeId))

const { data: subjectsData } = await useFetch('/api/subjects', { query: { grade_id: gradeId } })
subjects.value = (subjectsData.value as Subject[]) ?? []

const { data: chaptersData } = await useFetch('/api/chapters', { query: { grade_id: gradeId } })
chapters.value = (chaptersData.value as Chapter[]) ?? []

function chaptersForSubject(subjectId: string) {
  return chapters.value.filter((c) => c.subject_id === subjectId)
}

useHead(() => ({
  title: gradeFromList.value ? `${gradeFromList.value.name} - Τάξεις` : 'Τάξη',
}))

onMounted(() => {
  if (import.meta.client) {
    const { revealSection } = useGsapReveal()
    nextTick(() => {
      revealSection('#grade-title')
      revealSection('#grade-content')
    })
  }
})
</script>

<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-12">
    <div id="grade-title">
      <LayoutPageIntro
        eyebrow="Τάξεις"
        :title="gradeFromList?.name ?? 'Τάξη'"
        lead="Μαθήματα και κεφάλαια"
      />
    </div>
    <div id="grade-content" class="mt-8 space-y-8">
      <section v-for="subj in subjects" :key="subj.id">
        <h2 class="font-heading text-xl font-semibold mb-4">{{ subj.name }}</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <NuxtLink
            v-for="c in chaptersForSubject(subj.id)"
            :key="c.id"
            :to="`/chapter/${c.id}`"
            class="block"
          >
            <UiCard class="bobble-card rounded-3xl border-border/80 shadow-sm transition-shadow hover:shadow-md">
              <UiCardHeader class="flex flex-row items-center gap-3 pb-2">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                  <VIcon name="bi-journal-bookmark" class="size-4" />
                </span>
                <UiCardTitle class="font-heading text-base leading-snug">{{ c.title }}</UiCardTitle>
              </UiCardHeader>
              <UiCardContent class="pt-0 pb-4">
                <span class="text-xs text-muted-foreground">Κεφάλαιο</span>
              </UiCardContent>
            </UiCard>
          </NuxtLink>
        </div>
        <p v-if="chaptersForSubject(subj.id).length === 0" class="text-muted-foreground text-sm mt-2">
          Δεν υπάρχει ακόμη υλικό.
        </p>
      </section>
    </div>
    <p v-if="subjects.length === 0" class="text-muted-foreground">Δεν υπάρχουν ακόμη μαθήματα για αυτή την τάξη.</p>
  </div>
</template>
