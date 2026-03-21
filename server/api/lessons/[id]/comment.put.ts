import { notifyCommentCreated } from '../../../utils/adminNotifications'
import { requireAuth } from '../../../utils/requireAuth'
import { canAccessLesson } from '../../../utils/access'
import { serverSupabaseService } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const lessonId = getRouterParam(event, 'id')
  if (!lessonId) throw createError({ statusCode: 400, message: 'Missing lesson id' })

  const { allowed } = await canAccessLesson(userId, lessonId)
  if (!allowed) throw createError({ statusCode: 403, message: 'Access denied' })

  const body = await readBody<{ body: string }>(event)
  const trimmed = typeof body?.body === 'string' ? body.body.trim() : ''
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw createError({ statusCode: 400, message: 'Comment body must be between 1 and 2000 characters' })
  }

  const supabase = serverSupabaseService()
  const { data: existing } = await supabase
    .from('lesson_comments')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const { data, error } = await supabase
    .from('lesson_comments')
    .upsert(
      { user_id: userId, lesson_id: lessonId, body: trimmed },
      { onConflict: 'user_id,lesson_id' },
    )
    .select()
    .single()

  if (error) {
    console.error('[lessons/[id]/comment.put]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  if (!existing && data?.id) {
    try {
      await notifyCommentCreated(supabase, data.id)
    } catch (e) {
      console.error('[lessons/[id]/comment.put] notify', e)
    }
  }

  return data
})
