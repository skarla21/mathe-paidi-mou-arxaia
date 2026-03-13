import { serverSupabaseService } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const courseId = query.course_id as string | undefined
  if (!courseId) throw createError({ statusCode: 400, message: 'course_id required' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
