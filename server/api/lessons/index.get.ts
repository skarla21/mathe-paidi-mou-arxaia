import { serverSupabaseAnon } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const chapterId = query.chapter_id as string | undefined
  const categoryId = query.category_id as string | undefined
  if (!chapterId && !categoryId) {
    throw createError({ statusCode: 400, message: 'chapter_id or category_id required' })
  }
  const supabase = serverSupabaseAnon()
  let q = supabase
    .from('lesson_placements')
    .select('order, lessons(id, title, is_free, price, content_url, created_at)')
  if (chapterId) q = q.eq('chapter_id', chapterId)
  if (categoryId) q = q.eq('category_id', categoryId)
  const { data, error } = await q.order('order', { ascending: true })
  if (error) {
    console.error('[lessons/index.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  // Unwrap from placement rows to flat lesson array, preserving placement order
  const lessons = (data ?? []).map((row: { order: number; lessons: unknown }) => {
    const lesson = row.lessons as Record<string, unknown> | null
    return lesson ? { ...lesson, order: row.order } : null
  }).filter(Boolean)
  return lessons
})
