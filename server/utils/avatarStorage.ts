import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'uploads'
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`
const PAGE_SIZE = 100

function isSafeSegment(value: string): boolean {
  return value.length > 0
    && !value.includes('/')
    && !value.includes('\\')
    && value !== '.'
    && value !== '..'
}

export function avatarFilePath(userId: string, fileName: string): string | null {
  if (!isSafeSegment(userId) || !isSafeSegment(fileName)) return null
  return `avatars/${userId}/${fileName}`
}

export function avatarPathFromUrl(url: string, supabaseUrl: string, userId: string): string | null {
  if (!url || !supabaseUrl || !isSafeSegment(userId)) return null
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
  const prefix = `avatars/${userId}/`
  if (!path.startsWith(prefix)) return null
  return avatarFilePath(userId, path.slice(prefix.length))
}

type StoredObject = { name?: string | null; id?: string | null }
type AvatarWriteResult = 'ok' | 'db-failed'

function isUserAvatarPath(userId: string, path: string): boolean {
  const prefix = `avatars/${userId}/`
  if (!path.startsWith(prefix)) return false
  return avatarFilePath(userId, path.slice(prefix.length)) === path
}

async function savedAvatarPath(
  supabase: SupabaseClient,
  userId: string,
  supabaseUrl: string,
): Promise<string | null | 'blocked'> {
  const { data, error } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('[avatarStorage] read avatar_url', error.message)
    return 'blocked'
  }
  const url = data?.avatar_url
  if (!url) return null
  const path = avatarPathFromUrl(url, supabaseUrl, userId)
  if (path) return path
  try {
    if (new URL(url).origin === new URL(supabaseUrl).origin) {
      console.error('[avatarStorage] unread avatar url')
      return 'blocked'
    }
  } catch {
    console.error('[avatarStorage] unread avatar url')
    return 'blocked'
  }
  return null
}

export async function removeUserAvatarFiles(
  supabase: SupabaseClient,
  userId: string,
  supabaseUrl: string,
  keepPaths: string[] = [],
): Promise<void> {
  if (!isSafeSegment(userId)) return
  const folder = `avatars/${userId}`
  const found: string[] = []
  let offset = 0
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) {
      console.error('[avatarStorage] list', error.message)
      return
    }
    const rows = (data ?? []) as StoredObject[]
    for (const row of rows) {
      if (!row.id) continue
      const path = avatarFilePath(userId, row.name ?? '')
      if (path) found.push(path)
    }
    if (rows.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  const saved = await savedAvatarPath(supabase, userId, supabaseUrl)
  if (saved === 'blocked') return
  const keep = new Set<string>()
  if (saved) keep.add(saved)
  for (const path of keepPaths) {
    if (isUserAvatarPath(userId, path)) keep.add(path)
  }
  const paths = found.filter((path) => !keep.has(path))
  if (!paths.length) return
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) console.error('[avatarStorage] remove', error.message)
}

export async function replaceUserAvatar(
  supabase: SupabaseClient,
  userId: string,
  avatarUrl: string,
  uploadedPath: string,
  supabaseUrl: string,
): Promise<AvatarWriteResult> {
  if (!isSafeSegment(userId) || !isUserAvatarPath(userId, uploadedPath)) return 'db-failed'
  const { error } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
  if (error) {
    console.error('[avatarStorage] save avatar_url', error.message)
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([uploadedPath])
    if (removeError) console.error('[avatarStorage] rollback', removeError.message)
    return 'db-failed'
  }
  await removeUserAvatarFiles(supabase, userId, supabaseUrl, [uploadedPath])
  return 'ok'
}

export async function clearUserAvatar(
  supabase: SupabaseClient,
  userId: string,
  supabaseUrl: string,
): Promise<AvatarWriteResult> {
  if (!isSafeSegment(userId)) return 'db-failed'
  const { error } = await supabase
    .from('users')
    .update({ avatar_url: null })
    .eq('id', userId)
  if (error) {
    console.error('[avatarStorage] clear avatar_url', error.message)
    return 'db-failed'
  }
  await removeUserAvatarFiles(supabase, userId, supabaseUrl)
  return 'ok'
}
