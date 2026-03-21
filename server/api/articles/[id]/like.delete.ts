import { requireAuth } from '../../../utils/requireAuth'
import { serverSupabaseService } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const articleId = getRouterParam(event, 'id')
  if (!articleId) throw createError({ statusCode: 400, message: 'Missing article id' })

  const supabase = serverSupabaseService()
  const { error } = await supabase
    .from('article_likes')
    .delete()
    .eq('user_id', userId)
    .eq('article_id', articleId)

  if (error) {
    console.error('[articles/[id]/like.delete]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return { ok: true }
})
