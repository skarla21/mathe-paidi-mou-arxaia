import { serverSupabaseService } from '../../../../utils/supabaseServer'
import { requireAuth } from '../../../../utils/requireAuth'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const supabase = serverSupabaseService()
  const { error } = await supabase.from('admin_notification_reads').upsert(
    { notification_id: id, admin_user_id: userId, read_at: new Date().toISOString() },
    { onConflict: 'notification_id,admin_user_id' },
  )
  if (error) {
    console.error('[admin/notifications/read.post]', error.message)
    throw createError({ statusCode: 500, message: 'Failed to mark read' })
  }
  return { ok: true }
})
