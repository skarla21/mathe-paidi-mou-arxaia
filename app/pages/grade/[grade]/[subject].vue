<script setup lang="ts">
import UiCard from "~/components/ui/Card.vue";
import UiCardContent from "~/components/ui/CardContent.vue";
import type { Grade, Subject, Chapter, Lesson } from "~/types/database";

const route = useRoute();
const gradeId = route.params.grade as string;
const subjectId = route.params.subject as string;
const { t } = useI18n();

const grade = ref<Grade | null>(null);
const subject = ref<Subject | null>(null);
const chapters = ref<Chapter[]>([]);
const standaloneLesson = ref<Lesson[]>([]);

const { data: gradesData } = await useFetch("/api/grades");
const { data: subjectsData } = await useFetch("/api/subjects", {
  query: { grade_id: gradeId },
});
const { data: chaptersData } = await useFetch("/api/chapters", {
  query: { subject_id: subjectId },
});
const { data: lessonsData } = await useFetch("/api/lessons", {
  query: { subject_id: subjectId },
});

grade.value =
  (gradesData.value as Grade[] | null)?.find((g) => g.id === gradeId) ?? null;
subject.value =
  (subjectsData.value as Subject[] | null)?.find((s) => s.id === subjectId) ?? null;
chapters.value = (chaptersData.value as Chapter[] | null) ?? [];
standaloneLesson.value = (lessonsData.value as Lesson[] | null) ?? [];

useHead(() => ({
  title: subject.value
    ? `${subject.value.name} - ${grade.value?.name}`
    : t("subject.title"),
}));
</script>

<template>
  <div class="container py-8 px-4">
    <NuxtLink
      :to="`/grade/${gradeId}`"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
    >
      <VIcon name="bi-arrow-left" class="size-3.5" aria-hidden="true" />
      {{ grade?.name }}
    </NuxtLink>
    <h1 class="text-3xl font-bold mt-2 font-heading">
      {{ subject?.name ?? t("subject.title") }}
    </h1>

    <!-- Chapters section -->
    <div v-if="chapters.length > 0" class="mt-8">
      <h2 class="font-heading text-xl font-semibold mb-4">
        {{ t("chapter.title") }}
      </h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="c in chapters"
          :key="c.id"
          :to="`/chapter/${c.id}`"
          class="block"
        >
          <UiCard class="p-4 transition-colors hover:border-primary/50">
            <UiCardContent class="p-0">
              <span class="font-medium">{{ c.title }}</span>
            </UiCardContent>
          </UiCard>
        </NuxtLink>
      </div>
    </div>

    <!-- Standalone lessons section -->
    <div v-if="standaloneLesson.length > 0" class="mt-8">
      <h2 class="font-heading text-xl font-semibold mb-4">
        {{ t("lesson.title") }}
      </h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="l in standaloneLesson"
          :key="l.id"
          :to="`/lesson/${l.id}`"
          class="block"
        >
          <UiCard
            class="p-4 transition-colors hover:border-primary/50 flex items-center justify-between"
          >
            <UiCardContent class="p-0 flex items-center justify-between w-full">
              <span class="font-medium">{{ l.title }}</span>
              <VIcon
                v-if="!l.is_free"
                name="bi-gem"
                class="size-4 text-muted-foreground shrink-0 ml-2"
                aria-hidden="true"
              />
            </UiCardContent>
          </UiCard>
        </NuxtLink>
      </div>
    </div>

    <p
      v-if="chapters.length === 0 && standaloneLesson.length === 0"
      class="text-muted-foreground mt-8"
    >
      {{ t("chapter.noLessonsYet") }}
    </p>
  </div>
</template>
