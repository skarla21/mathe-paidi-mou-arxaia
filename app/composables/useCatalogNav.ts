interface ChapterLink {
  id: string
  slug: string
  title: string
  subject_id: string
  order: number
}

interface LessonLink {
  id: string
  slug: string
  title: string
  order: number
}

interface CategoryLink {
  id: string
  slug: string
  name: string
  description: string | null
  image_url: string | null
  order: number
}

export function useCatalogNav() {
  const { grades, subjects, ensure, failed, loaded } = useGradesData()
  const chaptersBySubject = useState<Record<string, ChapterLink[]>>('nav-chapters-by-subject', () => ({}))
  const lessonsBySubject = useState<Record<string, LessonLink[]>>('nav-lessons-by-subject', () => ({}))
  const contentRequests = useState<Record<string, boolean>>('nav-subject-content-loading', () => ({}))
  const chapterErrors = useState<Record<string, boolean>>('nav-chapters-error', () => ({}))
  const lessonErrors = useState<Record<string, boolean>>('nav-lessons-error', () => ({}))
  const categories = useState<CategoryLink[]>('nav-categories', () => [])
  const categoriesLoaded = useState('nav-categories-loaded', () => false)
  const categoriesFailed = useState('nav-categories-failed', () => false)

  function subjectsForGrade(gradeId: string) {
    return subjects.value.filter((subject) => subject.grade_id === gradeId)
  }

  function chaptersForSubject(subjectId: string) {
    return chaptersBySubject.value[subjectId] ?? []
  }

  function lessonsForSubject(subjectId: string) {
    return lessonsBySubject.value[subjectId] ?? []
  }

  function chaptersLoaded(subjectId: string) {
    return Object.hasOwn(chaptersBySubject.value, subjectId)
  }

  function lessonsLoaded(subjectId: string) {
    return Object.hasOwn(lessonsBySubject.value, subjectId)
  }

  function clearError(errors: Record<string, boolean>, subjectId: string) {
    if (!errors[subjectId]) return errors
    return Object.fromEntries(
      Object.entries(errors).filter(([id]) => id !== subjectId),
    )
  }

  async function loadChapters(subjectId: string) {
    try {
      const data = await $fetch<ChapterLink[]>('/api/chapters', {
        params: { subject_id: subjectId },
      })
      chaptersBySubject.value = {
        ...chaptersBySubject.value,
        [subjectId]: [...(data ?? [])].sort((a, b) => a.order - b.order),
      }
      chapterErrors.value = clearError(chapterErrors.value, subjectId)
    } catch {
      chapterErrors.value = { ...chapterErrors.value, [subjectId]: true }
    }
  }

  async function loadLessons(subjectId: string) {
    try {
      const data = await $fetch<LessonLink[]>('/api/lessons', {
        params: { subject_id: subjectId },
      })
      lessonsBySubject.value = {
        ...lessonsBySubject.value,
        [subjectId]: [...(data ?? [])].sort((a, b) => a.order - b.order),
      }
      lessonErrors.value = clearError(lessonErrors.value, subjectId)
    } catch {
      lessonErrors.value = { ...lessonErrors.value, [subjectId]: true }
    }
  }

  async function ensureSubjectContent(subjectId: string) {
    if (!subjectId || contentRequests.value[subjectId]) return
    const needChapters = !Object.hasOwn(chaptersBySubject.value, subjectId)
    const needLessons = !Object.hasOwn(lessonsBySubject.value, subjectId)
    if (!needChapters && !needLessons) return
    contentRequests.value = { ...contentRequests.value, [subjectId]: true }
    try {
      await Promise.all([
        needChapters ? loadChapters(subjectId) : Promise.resolve(),
        needLessons ? loadLessons(subjectId) : Promise.resolve(),
      ])
    } finally {
      contentRequests.value = { ...contentRequests.value, [subjectId]: false }
    }
  }

  function isSubjectContentLoading(subjectId: string) {
    return Boolean(contentRequests.value[subjectId])
  }

  function chaptersFailed(subjectId: string) {
    return chapterErrors.value[subjectId] === true
  }

  function lessonsFailed(subjectId: string) {
    return lessonErrors.value[subjectId] === true
  }

  async function ensureCategories() {
    if (categoriesLoaded.value) return
    try {
      const data = await $fetch<CategoryLink[]>('/api/categories')
      categories.value = [...(data ?? [])].sort((a, b) => a.order - b.order)
      categoriesFailed.value = false
      categoriesLoaded.value = true
    } catch {
      if (!categoriesLoaded.value) categoriesFailed.value = true
    }
  }

  return {
    grades,
    subjects,
    ensure,
    failed,
    loaded,
    subjectsForGrade,
    chaptersForSubject,
    lessonsForSubject,
    chaptersLoaded,
    lessonsLoaded,
    ensureSubjectContent,
    isSubjectContentLoading,
    chaptersFailed,
    lessonsFailed,
    categories,
    categoriesLoaded,
    categoriesFailed,
    ensureCategories,
  }
}
