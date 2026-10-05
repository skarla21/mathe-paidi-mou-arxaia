import type { SupabaseClient } from '@supabase/supabase-js'

type GradeRel = { slug: string | null }
type SubjectRel = { slug: string | null; grades: GradeRel | GradeRel[] | null }
type ChapterRel = { slug: string | null; subjects: SubjectRel | SubjectRel[] | null }
type CategoryRel = { slug: string | null }
type LessonRel = { slug: string | null }

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

type PlacementRow = {
  lesson_id: string
  order: number
  chapter_id: string | null
  subject_id: string | null
  category_id: string | null
  lessons: LessonRel | LessonRel[] | null
  chapters: ChapterRel | ChapterRel[] | null
  subjects: SubjectRel | SubjectRel[] | null
  categories: CategoryRel | CategoryRel[] | null
}

export function lessonPathFromPlacement(row: PlacementRow): string | null {
  const lesson = one(row.lessons)
  if (!lesson?.slug) return null
  if (row.chapter_id) {
    const chapter = one(row.chapters)
    const subject = one(chapter?.subjects ?? null)
    const grade = one(subject?.grades ?? null)
    if (chapter?.slug && subject?.slug && grade?.slug) {
      return `/${grade.slug}/${subject.slug}/${chapter.slug}/${lesson.slug}`
    }
  }
  if (row.subject_id) {
    const subject = one(row.subjects)
    const grade = one(subject?.grades ?? null)
    if (subject?.slug && grade?.slug) {
      return `/${grade.slug}/${subject.slug}/lesson/${lesson.slug}`
    }
  }
  if (row.category_id) {
    const category = one(row.categories)
    if (category?.slug) return `/category/${category.slug}/${lesson.slug}`
  }
  return null
}

function placementRank(row: PlacementRow): number {
  if (row.chapter_id) return 0
  if (row.subject_id) return 1
  return 2
}

const PLACEMENT_SELECT = `
  lesson_id,
  order,
  chapter_id,
  subject_id,
  category_id,
  lessons!inner(slug),
  chapters(slug, subjects(slug, grades(slug))),
  subjects(slug, grades(slug)),
  categories(slug)
`

export async function canonicalLessonPaths(
  supabase: SupabaseClient,
  lessonIds: string[],
): Promise<Map<string, string>> {
  const paths = new Map<string, string>()
  if (!lessonIds.length) return paths
  const { data, error } = await supabase
    .from('lesson_placements')
    .select(PLACEMENT_SELECT)
    .in('lesson_id', lessonIds)
  if (error) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  const grouped = new Map<string, PlacementRow[]>()
  for (const row of (data ?? []) as PlacementRow[]) {
    const list = grouped.get(row.lesson_id) ?? []
    list.push(row)
    grouped.set(row.lesson_id, list)
  }
  for (const [lessonId, rows] of grouped) {
    rows.sort((a, b) => placementRank(a) - placementRank(b) || a.order - b.order)
    for (const row of rows) {
      const path = lessonPathFromPlacement(row)
      if (path) {
        paths.set(lessonId, path)
        break
      }
    }
  }
  return paths
}

export function chapterPublicPath(row: {
  slug: string | null
  subjects: SubjectRel | SubjectRel[] | null
}): string | null {
  const subject = one(row.subjects)
  const grade = one(subject?.grades ?? null)
  if (!row.slug || !subject?.slug || !grade?.slug) return null
  return `/${grade.slug}/${subject.slug}/${row.slug}`
}
