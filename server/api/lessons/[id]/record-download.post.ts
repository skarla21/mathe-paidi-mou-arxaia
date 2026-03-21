import { notifyDownloadCreated } from '../../../utils/adminNotifications'
import { requireAuth } from '../../../utils/requireAuth'
import { canAccessLesson } from '../../../utils/access'
import { serverSupabaseService } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const lessonId = getRouterParam(event, 'id')
  if (!lessonId) throw createError({ statusCode: 400, message: 'Missing lesson id' })

  const supabase = serverSupabaseService()
  const { data: userRow } = await supabase
    .from('users')
    .select('email_verified')
    .eq('id', userId)
    .single()
  const emailVerified = !!userRow?.email_verified

  const { allowed, canAccessContent } = await canAccessLesson(userId, lessonId, emailVerified)
  if (!allowed || !canAccessContent) {
    throw createError({ statusCode: 403, message: 'Access denied' })
  }

  const { data: existing } = await supabase
    .from('downloads')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('downloads')
      .update({ downloaded_at: new Date().toISOString() })
      .eq('id', existing.id)
    return { ok: true, firstDownload: false }
  }

  const { data: inserted, error } = await supabase
    .from('downloads')
    .insert({ user_id: userId, lesson_id: lessonId })
    .select('id')
    .single()

  if (error) {
    console.error('[lessons/[id]/record-download.post]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  if (inserted?.id) {
    try {
      await notifyDownloadCreated(supabase, inserted.id)
    } catch (e) {
      console.error('[lessons/[id]/record-download.post] notify', e)
    }
  }

  return { ok: true, firstDownload: true }
})
