import { slugifyGreek } from '#shared/utils/slugify.mjs'

export function safeStorageName(filename: string): string {
  const base = filename.normalize('NFC').replace(/[\\/]/g, ' ').trim()
  const dot = base.lastIndexOf('.')
  const hasExt = dot > 0 && dot < base.length - 1
  const rawStem = hasExt ? base.slice(0, dot) : base
  const rawExt = hasExt ? base.slice(dot + 1) : ''
  const stem = (slugifyGreek(rawStem) || 'file').slice(0, 160)
  const ext = slugifyGreek(rawExt).replace(/-/g, '').slice(0, 12)
  const name = ext ? `${stem}.${ext}` : stem
  return name.slice(0, 180)
}

export function extensionForMime(mimeType: string): string {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'application/pdf') return 'pdf'
  return 'bin'
}

export function storedFileName(filename: string, mimeType: string, suffix: string): string {
  const safe = safeStorageName(filename)
  const dot = safe.lastIndexOf('.')
  const hasExt = dot > 0
  const stem = (hasExt ? safe.slice(0, dot) : safe) || 'file'
  const ext = extensionForMime(mimeType)
  const id = suffix.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'file'
  return `${stem}-${id}.${ext}`
}
