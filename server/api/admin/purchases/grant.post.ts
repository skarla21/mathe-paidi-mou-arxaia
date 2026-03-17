import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { userId, lessonId } = await readBody<{ userId: string; lessonId: string }>(event)
  if (!userId || !lessonId) throw createError({ statusCode: 400, message: 'userId and lessonId required' })
  const supabase = serverSupabaseService()
  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle()
  if (existing) return { ok: true }
  const { error } = await supabase.from('purchases').insert({ user_id: userId, lesson_id: lessonId, stripe_session_id: null })
  if (error) {
    console.error('[admin/purchases/grant.post]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return { ok: true }
})
