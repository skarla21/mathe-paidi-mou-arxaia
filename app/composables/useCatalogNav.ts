interface ChapterLink {
  id: string
  slug: string
  title: string
  subject_id: string
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
  const chapterRequests = useState<Record<string, boolean>>('nav-chapters-loading', () => ({}))
  const chapterErrors = useState<Record<string, boolean>>('nav-chapters-error', () => ({}))
  const categories = useState<CategoryLink[]>('nav-categories', () => [])
  const categoriesLoaded = useState('nav-categories-loaded', () => false)
  const categoriesFailed = useState('nav-categories-failed', () => false)

  function subjectsForGrade(gradeId: string) {
    return subjects.value.filter((subject) => subject.grade_id === gradeId)
  }

  function chaptersForSubject(subjectId: string) {
    return chaptersBySubject.value[subjectId] ?? []
  }

  function clearChapterError(subjectId: string) {
    if (!chapterErrors.value[subjectId]) return
    chapterErrors.value = Object.fromEntries(
      Object.entries(chapterErrors.value).filter(([id]) => id !== subjectId),
    )
  }

  async function ensureChapters(subjectId: string) {
    if (!subjectId) return
    if (Object.hasOwn(chaptersBySubject.value, subjectId) || chapterRequests.value[subjectId] === true) return
    chapterRequests.value = { ...chapterRequests.value, [subjectId]: true }
    clearChapterError(subjectId)
    try {
      const data = await $fetch<ChapterLink[]>('/api/chapters', {
        params: { subject_id: subjectId },
      })
      chaptersBySubject.value = {
        ...chaptersBySubject.value,
        [subjectId]: [...(data ?? [])].sort((a, b) => a.order - b.order),
      }
    } catch {
      chapterErrors.value = { ...chapterErrors.value, [subjectId]: true }
    } finally {
      chapterRequests.value = { ...chapterRequests.value, [subjectId]: false }
    }
  }

  function isChaptersLoading(subjectId: string) {
    return Boolean(chapterRequests.value[subjectId])
  }

  function chaptersFailed(subjectId: string) {
    return chapterErrors.value[subjectId] === true
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
    ensureChapters,
    isChaptersLoading,
    chaptersFailed,
    categories,
    categoriesLoaded,
    categoriesFailed,
    ensureCategories,
  }
}
