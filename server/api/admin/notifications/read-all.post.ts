import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAuth } from '../../../utils/requireAuth'
import { requireAdmin } from '../../../utils/requireAdmin'
import {
  DEFAULT_ADMIN_NOTIFICATION_PREFS,
  type AdminNotificationKind,
} from '../../../utils/adminNotifications'

function allowedKindsFromPrefs(prefs: typeof DEFAULT_ADMIN_NOTIFICATION_PREFS): AdminNotificationKind[] {
  const out: AdminNotificationKind[] = []
  if (prefs.notify_purchase) out.push('purchase')
  if (prefs.notify_download) out.push('download')
  if (prefs.notify_rating) out.push('rating')
  if (prefs.notify_comment) out.push('comment')
  if (prefs.notify_contact) out.push('contact')
  return out
}

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  requireAdmin(event)
  const supabase = serverSupabaseService()

  const { data: prefRow } = await supabase
    .from('admin_notification_preferences')
    .select(
      'notify_purchase, notify_download, notify_rating, notify_comment, notify_contact',
    )
    .eq('admin_user_id', userId)
    .maybeSingle()

  const prefs = prefRow ?? DEFAULT_ADMIN_NOTIFICATION_PREFS
  const allowed = allowedKindsFromPrefs(prefs)
  if (!allowed.length) return { ok: true }

  const { data: notifs, error: nErr } = await supabase
    .from('admin_notifications')
    .select('id')
    .in('kind', allowed)

  if (nErr) {
    console.error('[admin/notifications/read-all.post]', nErr.message)
    throw createError({ statusCode: 500, message: 'Failed to load notifications' })
  }

  const ids = (notifs ?? []).map((r) => r.id)
  if (!ids.length) return { ok: true }

  const rows = ids.map((notification_id) => ({
    notification_id,
    admin_user_id: userId,
    read_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('admin_notification_reads').upsert(rows, {
    onConflict: 'notification_id,admin_user_id',
  })
  if (error) {
    console.error('[admin/notifications/read-all.post]', error.message)
    throw createError({ statusCode: 500, message: 'Failed to mark all read' })
  }
  return { ok: true }
})
