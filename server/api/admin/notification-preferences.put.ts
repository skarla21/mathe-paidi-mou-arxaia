import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAuth } from '../../utils/requireAuth'
import { requireAdmin } from '../../utils/requireAdmin'
import { DEFAULT_ADMIN_NOTIFICATION_PREFS } from '../../utils/adminNotifications'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  requireAdmin(event)
  const body = await readBody<{
    notify_purchase?: boolean
    notify_download?: boolean
    notify_rating?: boolean
    notify_comment?: boolean
    notify_contact?: boolean
    notify_article_like?: boolean
    notify_article_comment?: boolean
  }>(event)

  const supabase = serverSupabaseService()
  const { data: existing } = await supabase
    .from('admin_notification_preferences')
    .select(
      'notify_purchase, notify_download, notify_rating, notify_comment, notify_contact, notify_article_like, notify_article_comment',
    )
    .eq('admin_user_id', userId)
    .maybeSingle()

  const base = { ...DEFAULT_ADMIN_NOTIFICATION_PREFS, ...(existing ?? {}) }
  const row = {
    admin_user_id: userId,
    notify_purchase: body.notify_purchase ?? base.notify_purchase,
    notify_download: body.notify_download ?? base.notify_download,
    notify_rating: body.notify_rating ?? base.notify_rating,
    notify_comment: body.notify_comment ?? base.notify_comment,
    notify_contact: body.notify_contact ?? base.notify_contact,
    notify_article_like: body.notify_article_like ?? base.notify_article_like,
    notify_article_comment: body.notify_article_comment ?? base.notify_article_comment,
  }

  const { error } = await supabase.from('admin_notification_preferences').upsert(row, {
    onConflict: 'admin_user_id',
  })
  if (error) {
    console.error('[admin/notification-preferences.put]', error.message)
    throw createError({ statusCode: 500, message: 'Failed to save preferences' })
  }
  return row
})
