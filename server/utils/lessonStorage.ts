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
const LESSON_FOLDER = 'lesson-content'
export const LESSON_CONTENT_REAP_AGE_MS = 15 * 60 * 1000

type LessonContentRow = { content_url?: string | null }
type StoredObject = {
  name?: string | null
  id?: string | null
  created_at?: string | null
}

async function referencedLessonContentPaths(
  supabase: SupabaseClient,
  supabaseUrl: string,
): Promise<Set<string> | null> {
  const paths = new Set<string>()
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
      return null
    }
    const rows = (data ?? []) as LessonContentRow[]
    for (const row of rows) {
      if (!row.content_url) continue
      const path = lessonContentPathFromUrl(row.content_url, supabaseUrl)
      if (!path) {
        console.error('[lessonStorage] unrecognized content url')
        return null
      }
      paths.add(path)
    }
    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return paths
}

function lessonObjectPath(name: string | null | undefined): string | null {
  if (!name || name.includes('/') || name.includes('\\') || name === '.' || name === '..') return null
  return `${LESSON_PREFIX}${name}`
}

function isStaleObject(createdAt: string | null | undefined, now: number): boolean {
  if (!createdAt) return false
  const created = Date.parse(createdAt)
  if (Number.isNaN(created)) return false
  return created <= now - LESSON_CONTENT_REAP_AGE_MS
}

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

  await removeUnusedLessonPath(supabase, path, supabaseUrl)
}

export async function removeUnusedLessonPath(
  supabase: SupabaseClient,
  path: string,
  supabaseUrl = String(useRuntimeConfig().public.supabaseUrl || ''),
): Promise<void> {
  if (!path.startsWith(LESSON_PREFIX)) return
  const referenced = await referencedLessonContentPaths(supabase, supabaseUrl)
  if (!referenced || referenced.has(path)) return

  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) console.error('[lessonStorage] remove', error.message)
}

export async function reapOrphanLessonContent(
  supabase: SupabaseClient,
  supabaseUrl = String(useRuntimeConfig().public.supabaseUrl || ''),
  now = Date.now(),
): Promise<void> {
  const referenced = await referencedLessonContentPaths(supabase, supabaseUrl)
  if (!referenced) return

  const stale: string[] = []
  let offset = 0
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list(LESSON_FOLDER, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) {
      console.error('[lessonStorage] list lesson-content', error.message)
      return
    }
    const objects = (data ?? []) as StoredObject[]
    for (const object of objects) {
      const path = lessonObjectPath(object.name)
      if (!path || !object.id || referenced.has(path) || !isStaleObject(object.created_at, now)) continue
      stale.push(path)
    }
    if (objects.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  for (let index = 0; index < stale.length; index += 100) {
    const batch = stale.slice(index, index + 100)
    const { error } = await supabase.storage.from(BUCKET).remove(batch)
    if (error) console.error('[lessonStorage] reap', error.message)
  }
}
