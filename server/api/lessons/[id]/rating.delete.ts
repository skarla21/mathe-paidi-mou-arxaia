import { requireAuth } from '../../../utils/requireAuth'
import { serverSupabaseService } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const lessonId = getRouterParam(event, 'id')
  if (!lessonId) throw createError({ statusCode: 400, message: 'Missing lesson id' })

  const supabase = serverSupabaseService()
  const { error } = await supabase
    .from('lesson_ratings')
    .delete()
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)

  if (error) {
    console.error('[lessons/[id]/rating.delete]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  return { ok: true }
})
