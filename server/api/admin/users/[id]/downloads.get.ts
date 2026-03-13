import { serverSupabaseService } from '../../../../utils/supabaseServer'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('lesson_downloads').select('*, lessons(title)').eq('user_id', id!).order('downloaded_at', { ascending: false }).limit(20)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
