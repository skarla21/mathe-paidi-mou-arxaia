// app/composables/useGradesData.ts
// Shared grades + subjects data with cross-navigation useState cache.
// Shared grades + subjects cache for the header menus and the home page.

interface Grade {
  id: string
  slug: string
  name: string
  order: number
}

interface Subject {
  id: string
  slug: string
  name: string
  grade_id: string
}

export function useGradesData() {
  const grades = useState<Grade[]>('grades-data', () => [])
  const subjects = useState<Subject[]>('subjects-data', () => [])
  const loaded = useState<boolean>('grades-data-loaded', () => false)
  const failed = useState<boolean>('grades-data-failed', () => false)

  async function ensure() {
    if (loaded.value) return
    try {
      const [gradesRes, subjectsRes] = await Promise.all([
        $fetch<Grade[]>('/api/grades'),
        $fetch<Subject[]>('/api/subjects'),
      ])
      grades.value = (gradesRes ?? []).sort((a, b) => a.order - b.order)
      subjects.value = subjectsRes ?? []
      failed.value = false
      loaded.value = true
    } catch (err) {
      if (!loaded.value) failed.value = true
      if (import.meta.dev) console.warn('[useGradesData] fetch failed:', err)
    }
  }

  return { grades, subjects, ensure, failed, loaded }
}
