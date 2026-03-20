import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const commentId = getRouterParam(event, 'id')
  if (!commentId) throw createError({ statusCode: 400, message: 'Missing id parameter' })
  const supabase = serverSupabaseService()
  const { error } = await supabase
    .from('lesson_comments').delete().eq('id', commentId)
  if (error) throw createError({ statusCode: 500, message: 'Database operation failed' })
  return { ok: true }
})
