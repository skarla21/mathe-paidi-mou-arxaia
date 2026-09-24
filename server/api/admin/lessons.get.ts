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
    .select('id, lesson_id, subject_id, chapter_id, category_id, order, subjects(name, grade_id), chapters(title, grade_id, subject_id), categories(name)')
    .order('order', { ascending: true })
  if (placementsErr) throw createError({ statusCode: 500, message: placementsErr.message })

  // Fetch rating/comment aggregates
  const [ratingsRes, commentsRes] = await Promise.all([
    supabase.from('lesson_ratings').select('lesson_id, rating'),
    supabase.from('lesson_comments').select('lesson_id'),
  ])
  if (ratingsRes.error) console.error('[admin/lessons] ratings query:', ratingsRes.error.message)
  if (commentsRes.error) console.error('[admin/lessons] comments query:', commentsRes.error.message)
  const ratingData = ratingsRes.data
  const commentData = commentsRes.data

  // Group placements by lesson_id
  const placementMap = new Map<string, typeof placements>()
  for (const p of placements ?? []) {
    const list = placementMap.get(p.lesson_id) ?? []
    list.push(p)
    placementMap.set(p.lesson_id, list)
  }

  // Group ratings by lesson_id
  const ratingMap = new Map<string, number[]>()
  for (const r of (ratingData ?? []) as { lesson_id: string; rating: number }[]) {
    const list = ratingMap.get(r.lesson_id) ?? []
    list.push(r.rating)
    ratingMap.set(r.lesson_id, list)
  }

  // Group comment counts by lesson_id
  const commentCountMap = new Map<string, number>()
  for (const c of (commentData ?? []) as { lesson_id: string }[]) {
    commentCountMap.set(c.lesson_id, (commentCountMap.get(c.lesson_id) ?? 0) + 1)
  }

  // Merge placements + rating/comment aggregates into each lesson
  return (lessons ?? []).map((lesson) => {
    const ratings = ratingMap.get(lesson.id) ?? []
    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 100) / 100
      : 0
    return {
      ...lesson,
      placements: placementMap.get(lesson.id) ?? [],
      avgRating,
      ratingCount: ratings.length,
      commentCount: commentCountMap.get(lesson.id) ?? 0,
    }
  })
})
