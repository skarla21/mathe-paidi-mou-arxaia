import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { userId, courseId } = await readBody<{ userId: string; courseId: string }>(event)
  if (!userId || !courseId) throw createError({ statusCode: 400, message: 'userId and courseId required' })
  const supabase = serverSupabaseService()
  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (existing) return { ok: true }
  const { error } = await supabase.from('purchases').insert({ user_id: userId, course_id: courseId, stripe_session_id: null })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
