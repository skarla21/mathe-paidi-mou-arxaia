import { createError, type H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DownloadWithJoins } from '../../types/domain'
import { requireAdmin } from './requireAdmin'

export const ADMIN_DOWNLOADS_PAGE_SIZE = 1000

export async function loadAdminDownloads(event: H3Event, supabase: SupabaseClient) {
  requireAdmin(event)
  const rows: DownloadWithJoins[] = []
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('downloads')
      .select('*, users(name, email), lessons(title, is_free)')
      .order('downloaded_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + ADMIN_DOWNLOADS_PAGE_SIZE - 1)
    if (error) {
      console.error('[admin/downloads.get]', error.message)
      throw createError({ statusCode: 500, message: 'Database operation failed' })
    }
    const page = (data ?? []) as DownloadWithJoins[]
    rows.push(...page)
    if (page.length < ADMIN_DOWNLOADS_PAGE_SIZE) return rows
    from += ADMIN_DOWNLOADS_PAGE_SIZE
  }
}
