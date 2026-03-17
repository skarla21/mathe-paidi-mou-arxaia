import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { name, grade_id } = await readBody<{ name: string; grade_id: string }>(event)
  if (!name?.trim() || !grade_id) throw createError({ statusCode: 400, message: 'name and grade_id required' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('subjects').insert({ name: name.trim(), grade_id }).select().single()
  if (error) {
    console.error('[admin/subjects.post]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return data
})
