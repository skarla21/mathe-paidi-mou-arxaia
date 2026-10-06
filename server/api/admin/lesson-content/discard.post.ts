import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'
import { removeUnusedLessonContent } from '../../../utils/lessonStorage'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ url?: unknown }>(event)
  if (!body?.url || typeof body.url !== 'string') {
    throw createError({ statusCode: 400, message: 'Λείπει το αρχείο' })
  }
  const supabase = serverSupabaseService()
  await removeUnusedLessonContent(supabase, body.url)
  return { ok: true }
})
