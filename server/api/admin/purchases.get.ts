import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('purchases')
    .select('*, users(name, email), lessons(title)')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[admin/purchases.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return data ?? []
})
