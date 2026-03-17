import { serverSupabaseAnon } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const chapterId = query.chapter_id as string | undefined
  const subjectId = query.subject_id as string | undefined
  const categoryId = query.category_id as string | undefined
  if (!chapterId && !subjectId && !categoryId) {
    throw createError({ statusCode: 400, message: 'chapter_id, subject_id, or category_id required' })
  }
  const supabase = serverSupabaseAnon()
  let q = supabase.from('lessons').select('id, title, description, order, is_free, chapter_id, subject_id, category_id, created_at')
  if (chapterId) q = q.eq('chapter_id', chapterId)
  if (subjectId) q = q.eq('subject_id', subjectId)
  if (categoryId) q = q.eq('category_id', categoryId)
  const { data, error } = await q.order('order', { ascending: true })
  if (error) {
    console.error('[lessons/index.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return data ?? []
})
