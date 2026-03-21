import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAuth } from '../../utils/requireAuth'
import { requireAdmin } from '../../utils/requireAdmin'
import {
  cleanupOldAdminNotifications,
  DEFAULT_ADMIN_NOTIFICATION_PREFS,
  type AdminNotificationKind,
} from '../../utils/adminNotifications'

function allowedKindsFromPrefs(prefs: typeof DEFAULT_ADMIN_NOTIFICATION_PREFS): AdminNotificationKind[] {
  const out: AdminNotificationKind[] = []
  if (prefs.notify_purchase) out.push('purchase')
  if (prefs.notify_download) out.push('download')
  if (prefs.notify_rating) out.push('rating')
  if (prefs.notify_comment) out.push('comment')
  if (prefs.notify_contact) out.push('contact')
  if (prefs.notify_article_like) out.push('article_like')
  if (prefs.notify_article_comment) out.push('article_comment')
  return out
}

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  requireAdmin(event)
  const supabase = serverSupabaseService()
  await cleanupOldAdminNotifications(supabase)

  const { data: prefRow } = await supabase
    .from('admin_notification_preferences')
    .select(
      'notify_purchase, notify_download, notify_rating, notify_comment, notify_contact, notify_article_like, notify_article_comment',
    )
    .eq('admin_user_id', userId)
    .maybeSingle()

  const prefs = prefRow ?? DEFAULT_ADMIN_NOTIFICATION_PREFS
  const allowed = allowedKindsFromPrefs(prefs)

  if (allowed.length === 0) {
    return { items: [], unreadCount: 0 }
  }

  const query = getQuery(event)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50))

  const { data: rows, error } = await supabase
    .from('admin_notifications')
    .select('id, kind, payload, created_at')
    .in('kind', allowed)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[admin/notifications.get]', error.message)
    throw createError({ statusCode: 500, message: 'Failed to load notifications' })
  }

  const listIds = (rows ?? []).map((r) => r.id)
  let readSet = new Set<string>()
  if (listIds.length) {
    const { data: reads } = await supabase
      .from('admin_notification_reads')
      .select('notification_id')
      .eq('admin_user_id', userId)
      .in('notification_id', listIds)
    readSet = new Set((reads ?? []).map((r) => r.notification_id))
  }

  const items = (rows ?? []).map((r) => ({
    id: r.id,
    kind: r.kind as AdminNotificationKind,
    payload: r.payload as Record<string, unknown>,
    created_at: r.created_at,
    read: readSet.has(r.id),
  }))

  const { data: allKindIds } = await supabase
    .from('admin_notifications')
    .select('id')
    .in('kind', allowed)

  const allIds = (allKindIds ?? []).map((r) => r.id)
  let unreadCount = 0
  if (allIds.length) {
    const { data: allReads } = await supabase
      .from('admin_notification_reads')
      .select('notification_id')
      .eq('admin_user_id', userId)
      .in('notification_id', allIds)
    const readAll = new Set((allReads ?? []).map((r) => r.notification_id))
    unreadCount = allIds.filter((id) => !readAll.has(id)).length
  }

  return { items, unreadCount }
})
