import { serverSupabaseService } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const chapterId = query.chapter_id as string | undefined
  const subjectId = query.subject_id as string | undefined
  const categoryId = query.category_id as string | undefined
  if (!chapterId && !subjectId && !categoryId) {
    throw createError({ statusCode: 400, message: 'chapter_id, subject_id, or category_id required' })
  }
  const supabase = serverSupabaseService()
  let q = supabase.from('lessons').select('*')
  if (chapterId) q = q.eq('chapter_id', chapterId)
  if (subjectId) q = q.eq('subject_id', subjectId)
  if (categoryId) q = q.eq('category_id', categoryId)
  const { data, error } = await q.order('order', { ascending: true })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
