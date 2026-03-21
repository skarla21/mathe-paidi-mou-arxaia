import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAuth } from '../../utils/requireAuth'
import { requireAdmin } from '../../utils/requireAdmin'
import { DEFAULT_ADMIN_NOTIFICATION_PREFS } from '../../utils/adminNotifications'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  requireAdmin(event)
  const supabase = serverSupabaseService()

  const { data } = await supabase
    .from('admin_notification_preferences')
    .select(
      'notify_purchase, notify_download, notify_rating, notify_comment, notify_contact, notify_article_like, notify_article_comment',
    )
    .eq('admin_user_id', userId)
    .maybeSingle()

  return {
    ...DEFAULT_ADMIN_NOTIFICATION_PREFS,
    ...(data ?? {}),
  }
})
