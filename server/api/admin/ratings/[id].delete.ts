import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const reviewId = getRouterParam(event, 'id')
  if (!reviewId) throw createError({ statusCode: 400, message: 'Missing id parameter' })
  const supabase = serverSupabaseService()
  const { error } = await supabase
    .from('lesson_ratings').delete().eq('id', reviewId)
  if (error) throw createError({ statusCode: 500, message: 'Database operation failed' })
  return { ok: true }
})
