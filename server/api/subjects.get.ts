import { serverSupabaseService } from '../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const gradeId = query.grade_id as string | undefined
  const supabase = serverSupabaseService()
  let q = supabase.from('subjects').select('*')
  if (gradeId) {
    q = q.eq('grade_id', gradeId)
  }
  const { data, error } = await q.order('name', { ascending: true })
  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }
  return data ?? []
})
