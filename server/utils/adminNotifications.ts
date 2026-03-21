import type { SupabaseClient } from '@supabase/supabase-js'

export type AdminNotificationKind =
  | 'purchase'
  | 'download'
  | 'rating'
  | 'comment'
  | 'contact'
  | 'article_like'
  | 'article_comment'

export interface AdminNotificationPreferencesRow {
  admin_user_id: string
  notify_purchase: boolean
  notify_download: boolean
  notify_rating: boolean
  notify_comment: boolean
  notify_contact: boolean
  notify_article_like: boolean
  notify_article_comment: boolean
}

const KIND_TO_COLUMN: Record<
  AdminNotificationKind,
  keyof Pick<
    AdminNotificationPreferencesRow,
    | 'notify_purchase'
    | 'notify_download'
    | 'notify_rating'
    | 'notify_comment'
    | 'notify_contact'
    | 'notify_article_like'
    | 'notify_article_comment'
  >
> = {
  purchase: 'notify_purchase',
  download: 'notify_download',
  rating: 'notify_rating',
  comment: 'notify_comment',
  contact: 'notify_contact',
  article_like: 'notify_article_like',
  article_comment: 'notify_article_comment',
}

export const DEFAULT_ADMIN_NOTIFICATION_PREFS: Omit<
  AdminNotificationPreferencesRow,
  'admin_user_id'
> = {
  notify_purchase: true,
  notify_download: true,
  notify_rating: true,
  notify_comment: true,
  notify_contact: true,
  notify_article_like: true,
  notify_article_comment: true,
}

export function kindAllowedByPrefs(
  kind: AdminNotificationKind,
  prefs: Omit<AdminNotificationPreferencesRow, 'admin_user_id'> | null,
): boolean {
  const p = prefs ?? DEFAULT_ADMIN_NOTIFICATION_PREFS
  return p[KIND_TO_COLUMN[kind]] !== false
}

/** Insert a notification; ignores unique (kind, source_id) violations. */
export async function createAdminNotification(
  supabase: SupabaseClient,
  params: {
    kind: AdminNotificationKind
    payload: Record<string, unknown>
    sourceId?: string | null
  },
): Promise<void> {
  const { error } = await supabase.from('admin_notifications').insert({
    kind: params.kind,
    payload: params.payload,
    source_id: params.sourceId ?? null,
  })
  if (error) {
    if (error.code === '23505') return
    console.error('[createAdminNotification]', error.message)
  }
}

export async function cleanupOldAdminNotifications(supabase: SupabaseClient): Promise<void> {
  const cutoff = new Date()
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 1)
  const { error } = await supabase
    .from('admin_notifications')
    .delete()
    .lt('created_at', cutoff.toISOString())
  if (error) console.error('[cleanupOldAdminNotifications]', error.message)
}

async function lessonTitle(supabase: SupabaseClient, lessonId: string): Promise<string> {
  const { data } = await supabase.from('lessons').select('title').eq('id', lessonId).maybeSingle()
  return data?.title ?? ''
}

async function articleTitle(supabase: SupabaseClient, articleId: string): Promise<string> {
  const { data } = await supabase.from('articles').select('title').eq('id', articleId).maybeSingle()
  return data?.title ?? ''
}

async function userDisplay(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ name: string | null; email: string | null }> {
  const { data } = await supabase.from('users').select('name, email').eq('id', userId).maybeSingle()
  return { name: data?.name ?? null, email: data?.email ?? null }
}

export async function notifyPurchaseCreated(
  supabase: SupabaseClient,
  purchaseId: string,
): Promise<void> {
  const { data: row, error } = await supabase
    .from('purchases')
    .select('id, user_id, lesson_id')
    .eq('id', purchaseId)
    .single()
  if (error || !row) {
    if (error) console.error('[notifyPurchaseCreated]', error.message)
    return
  }
  const [lesson_title, u] = await Promise.all([
    lessonTitle(supabase, row.lesson_id),
    userDisplay(supabase, row.user_id),
  ])
  await createAdminNotification(supabase, {
    kind: 'purchase',
    sourceId: row.id,
    payload: {
      purchase_id: row.id,
      lesson_id: row.lesson_id,
      lesson_title,
      user_id: row.user_id,
      user_name: u.name,
      user_email: u.email,
    },
  })
}

export async function notifyDownloadCreated(
  supabase: SupabaseClient,
  downloadId: string,
): Promise<void> {
  const { data: row, error } = await supabase
    .from('downloads')
    .select('id, user_id, lesson_id')
    .eq('id', downloadId)
    .single()
  if (error || !row) {
    if (error) console.error('[notifyDownloadCreated]', error.message)
    return
  }
  const [lesson_title, u] = await Promise.all([
    lessonTitle(supabase, row.lesson_id),
    userDisplay(supabase, row.user_id),
  ])
  await createAdminNotification(supabase, {
    kind: 'download',
    sourceId: row.id,
    payload: {
      download_id: row.id,
      lesson_id: row.lesson_id,
      lesson_title,
      user_id: row.user_id,
      user_name: u.name,
      user_email: u.email,
    },
  })
}

export async function notifyRatingCreated(supabase: SupabaseClient, ratingId: string): Promise<void> {
  const { data: row, error } = await supabase
    .from('lesson_ratings')
    .select('id, user_id, lesson_id, rating')
    .eq('id', ratingId)
    .single()
  if (error || !row) {
    if (error) console.error('[notifyRatingCreated]', error.message)
    return
  }
  const [lesson_title, u] = await Promise.all([
    lessonTitle(supabase, row.lesson_id),
    userDisplay(supabase, row.user_id),
  ])
  await createAdminNotification(supabase, {
    kind: 'rating',
    sourceId: row.id,
    payload: {
      rating_id: row.id,
      lesson_id: row.lesson_id,
      lesson_title,
      user_id: row.user_id,
      user_name: u.name,
      user_email: u.email,
      rating: row.rating,
    },
  })
}

export async function notifyCommentCreated(supabase: SupabaseClient, commentId: string): Promise<void> {
  const { data: row, error } = await supabase
    .from('lesson_comments')
    .select('id, user_id, lesson_id, body')
    .eq('id', commentId)
    .single()
  if (error || !row) {
    if (error) console.error('[notifyCommentCreated]', error.message)
    return
  }
  const [lesson_title, u] = await Promise.all([
    lessonTitle(supabase, row.lesson_id),
    userDisplay(supabase, row.user_id),
  ])
  const body = typeof row.body === 'string' ? row.body : ''
  const excerpt = body.length > 200 ? `${body.slice(0, 200)}…` : body
  await createAdminNotification(supabase, {
    kind: 'comment',
    sourceId: row.id,
    payload: {
      comment_id: row.id,
      lesson_id: row.lesson_id,
      lesson_title,
      user_id: row.user_id,
      user_name: u.name,
      user_email: u.email,
      excerpt,
    },
  })
}

export async function notifyContactMessage(
  supabase: SupabaseClient,
  params: { email: string; message: string },
): Promise<void> {
  const email = params.email.replace(/[\r\n]/g, '').slice(0, 320)
  const message = params.message.slice(0, 4000)
  await createAdminNotification(supabase, {
    kind: 'contact',
    payload: {
      email,
      message,
    },
  })
}

export async function notifyArticleLikeCreated(
  supabase: SupabaseClient,
  likeId: string,
): Promise<void> {
  const { data: row, error } = await supabase
    .from('article_likes')
    .select('id, user_id, article_id')
    .eq('id', likeId)
    .single()
  if (error || !row) {
    if (error) console.error('[notifyArticleLikeCreated]', error.message)
    return
  }
  const [article_title, u] = await Promise.all([
    articleTitle(supabase, row.article_id),
    userDisplay(supabase, row.user_id),
  ])
  await createAdminNotification(supabase, {
    kind: 'article_like',
    sourceId: row.id,
    payload: {
      like_id: row.id,
      article_id: row.article_id,
      article_title,
      user_id: row.user_id,
      user_name: u.name,
      user_email: u.email,
    },
  })
}

export async function notifyArticleCommentCreated(
  supabase: SupabaseClient,
  commentId: string,
): Promise<void> {
  const { data: row, error } = await supabase
    .from('article_comments')
    .select('id, user_id, article_id, body')
    .eq('id', commentId)
    .single()
  if (error || !row) {
    if (error) console.error('[notifyArticleCommentCreated]', error.message)
    return
  }
  const [article_title, u] = await Promise.all([
    articleTitle(supabase, row.article_id),
    userDisplay(supabase, row.user_id),
  ])
  const body = typeof row.body === 'string' ? row.body : ''
  const excerpt = body.length > 200 ? `${body.slice(0, 200)}…` : body
  await createAdminNotification(supabase, {
    kind: 'article_comment',
    sourceId: row.id,
    payload: {
      comment_id: row.id,
      article_id: row.article_id,
      article_title,
      user_id: row.user_id,
      user_name: u.name,
      user_email: u.email,
      excerpt,
    },
  })
}
