import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('chapters').select('*, subjects(name, grades(name))').order('order', { ascending: true })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
