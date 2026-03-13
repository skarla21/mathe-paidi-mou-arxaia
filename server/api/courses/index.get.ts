import { serverSupabaseService } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const gradeId = query.grade_id as string | undefined
  const subjectId = query.subject_id as string | undefined
  const supabase = serverSupabaseService()
  let q = supabase.from('courses').select('*')
  if (gradeId) q = q.eq('grade_id', gradeId)
  if (subjectId) q = q.eq('subject_id', subjectId)
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
