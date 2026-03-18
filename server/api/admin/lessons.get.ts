import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('lessons')
    .select('*, chapters(title, grade_id, subject_id), subjects(name, grade_id), categories(name)')
    .order('order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
