import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()

  // Fetch all lessons
  const { data: lessons, error: lessonsErr } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false })
  if (lessonsErr) throw createError({ statusCode: 500, message: lessonsErr.message })

  // Fetch all placements with chapter/category joins
  const { data: placements, error: placementsErr } = await supabase
    .from('lesson_placements')
    .select('id, lesson_id, chapter_id, category_id, order, chapters(title, grade_id, subject_id), categories(name)')
    .order('order', { ascending: true })
  if (placementsErr) throw createError({ statusCode: 500, message: placementsErr.message })

  // Group placements by lesson_id
  const placementMap = new Map<string, typeof placements>()
  for (const p of placements ?? []) {
    const list = placementMap.get(p.lesson_id) ?? []
    list.push(p)
    placementMap.set(p.lesson_id, list)
  }

  // Merge placements into each lesson
  return (lessons ?? []).map((lesson) => ({
    ...lesson,
    placements: placementMap.get(lesson.id) ?? [],
  }))
})
