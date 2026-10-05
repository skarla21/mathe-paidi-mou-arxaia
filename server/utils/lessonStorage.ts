import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'uploads'
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`
const LESSON_PREFIX = 'lesson-content/'

export function lessonContentPathFromUrl(url: string, supabaseUrl: string): string | null {
  if (!url || !supabaseUrl) return null
  let parsed: URL
  let base: URL
  try {
    parsed = new URL(url)
    base = new URL(supabaseUrl)
  } catch {
    return null
  }
  if (parsed.origin !== base.origin) return null
  const idx = parsed.pathname.indexOf(PUBLIC_PREFIX)
  if (idx === -1) return null
  let path: string
  try {
    path = decodeURIComponent(parsed.pathname.slice(idx + PUBLIC_PREFIX.length))
  } catch {
    return null
  }
  if (!path.startsWith(LESSON_PREFIX) || path.includes('\\')) return null
  const parts = path.split('/')
  if (parts.some((part) => part === '' || part === '.' || part === '..')) return null
  return path
}

const PAGE_SIZE = 1000

export async function removeUnusedLessonContent(
  supabase: SupabaseClient,
  contentUrl: string | null | undefined,
  supabaseUrl = String(useRuntimeConfig().public.supabaseUrl || ''),
): Promise<void> {
  if (!contentUrl) return
  const path = lessonContentPathFromUrl(contentUrl, supabaseUrl)
  if (!path) {
    console.warn('[lessonStorage] skip unrecognized content url')
    return
  }

  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('lessons')
      .select('content_url')
      .not('content_url', 'is', null)
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) {
      console.error('[lessonStorage] list content_url', error.message)
      return
    }
    const rows = (data ?? []) as Array<{ content_url?: string | null }>
    const stillUsed = rows.some((row) => {
      if (!row.content_url) return false
      return lessonContentPathFromUrl(row.content_url, supabaseUrl) === path
    })
    if (stillUsed) return
    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) console.error('[lessonStorage] remove', error.message)
}
