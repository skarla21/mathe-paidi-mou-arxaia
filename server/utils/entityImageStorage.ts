import type { SupabaseClient } from '@supabase/supabase-js'
import { LESSON_CONTENT_REAP_AGE_MS } from './lessonStorage'

const BUCKET = 'uploads'
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`
const IMAGE_PREFIX = 'entity-images/'
const IMAGE_FOLDER = 'entity-images'
const PAGE_SIZE = 1000
const IMAGE_TABLES = ['categories', 'chapters', 'subjects'] as const

type ImageRow = { image_url?: string | null }
type StoredObject = {
  name?: string | null
  id?: string | null
  created_at?: string | null
}
type ClassifiedUrl =
  | { kind: 'ignore' }
  | { kind: 'block' }
  | { kind: 'path'; path: string }

function classifyEntityImageUrl(url: string, supabaseUrl: string): ClassifiedUrl {
  if (!url || !supabaseUrl) return { kind: 'ignore' }
  let parsed: URL
  let base: URL
  try {
    parsed = new URL(url)
    base = new URL(supabaseUrl)
  } catch {
    return { kind: 'ignore' }
  }
  if (parsed.origin !== base.origin) return { kind: 'ignore' }
  const idx = parsed.pathname.indexOf(PUBLIC_PREFIX)
  if (idx === -1) return { kind: 'block' }
  let path: string
  try {
    path = decodeURIComponent(parsed.pathname.slice(idx + PUBLIC_PREFIX.length))
  } catch {
    return { kind: 'block' }
  }
  if (!path.startsWith(IMAGE_PREFIX) || path.includes('\\')) return { kind: 'block' }
  const parts = path.split('/')
  if (parts.length !== 2 || parts.some((part) => part === '' || part === '.' || part === '..')) {
    return { kind: 'block' }
  }
  return { kind: 'path', path }
}

export function entityImagePathFromUrl(url: string, supabaseUrl: string): string | null {
  const classified = classifyEntityImageUrl(url, supabaseUrl)
  return classified.kind === 'path' ? classified.path : null
}

async function referencedEntityImagePaths(
  supabase: SupabaseClient,
  supabaseUrl: string,
): Promise<Set<string> | null> {
  const paths = new Set<string>()
  for (const table of IMAGE_TABLES) {
    let from = 0
    for (;;) {
      const { data, error } = await supabase
        .from(table)
        .select('image_url')
        .not('image_url', 'is', null)
        .order('id')
        .range(from, from + PAGE_SIZE - 1)
      if (error) {
        console.error('[entityImageStorage] list image_url', error.message)
        return null
      }
      const rows = (data ?? []) as ImageRow[]
      for (const row of rows) {
        if (!row.image_url) continue
        const classified = classifyEntityImageUrl(row.image_url, supabaseUrl)
        if (classified.kind === 'block') {
          console.error('[entityImageStorage] unrecognized image url')
          return null
        }
        if (classified.kind === 'path') paths.add(classified.path)
      }
      if (rows.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }
  }
  return paths
}

function entityObjectPath(name: string | null | undefined): string | null {
  if (!name || name.includes('/') || name.includes('\\') || name === '.' || name === '..') return null
  return `${IMAGE_PREFIX}${name}`
}

function isStaleObject(createdAt: string | null | undefined, now: number): boolean {
  if (!createdAt) return false
  const created = Date.parse(createdAt)
  if (Number.isNaN(created)) return false
  return created <= now - LESSON_CONTENT_REAP_AGE_MS
}

export async function removeUnusedEntityImagePath(
  supabase: SupabaseClient,
  path: string,
  supabaseUrl = String(useRuntimeConfig().public.supabaseUrl || ''),
): Promise<void> {
  if (!path.startsWith(IMAGE_PREFIX)) return
  const referenced = await referencedEntityImagePaths(supabase, supabaseUrl)
  if (!referenced || referenced.has(path)) return
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) console.error('[entityImageStorage] remove', error.message)
}

export async function removeUnusedEntityImage(
  supabase: SupabaseClient,
  imageUrl: string | null | undefined,
  supabaseUrl = String(useRuntimeConfig().public.supabaseUrl || ''),
): Promise<void> {
  if (!imageUrl) return
  const classified = classifyEntityImageUrl(imageUrl, supabaseUrl)
  if (classified.kind !== 'path') {
    if (classified.kind === 'ignore') console.warn('[entityImageStorage] skip unrecognized image url')
    return
  }
  await removeUnusedEntityImagePath(supabase, classified.path, supabaseUrl)
}

export async function reapOrphanEntityImages(
  supabase: SupabaseClient,
  supabaseUrl = String(useRuntimeConfig().public.supabaseUrl || ''),
  now = Date.now(),
): Promise<void> {
  const referenced = await referencedEntityImagePaths(supabase, supabaseUrl)
  if (!referenced) return

  const stale: string[] = []
  let offset = 0
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list(IMAGE_FOLDER, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) {
      console.error('[entityImageStorage] list entity-images', error.message)
      return
    }
    const objects = (data ?? []) as StoredObject[]
    for (const object of objects) {
      const path = entityObjectPath(object.name)
      if (!path || !object.id || referenced.has(path) || !isStaleObject(object.created_at, now)) continue
      stale.push(path)
    }
    if (objects.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  for (let index = 0; index < stale.length; index += 100) {
    const batch = stale.slice(index, index + 100)
    const { error } = await supabase.storage.from(BUCKET).remove(batch)
    if (error) console.error('[entityImageStorage] reap', error.message)
  }
}
