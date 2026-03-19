import { serverSupabaseAnon } from '../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const gradeId = query.grade_id as string | undefined
  const supabase = serverSupabaseAnon()
  let q = supabase.from('subjects').select('*')
  if (gradeId) {
    q = q.eq('grade_id', gradeId)
  }
  const { data, error } = await q.order('order', { ascending: true }).order('name', { ascending: true })
  if (error) {
    console.error('[subjects.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return data ?? []
})
