const MAX_TAGS = 30
const MAX_TAG_LEN = 64

/** Normalize admin-provided tags: trim, dedupe case-insensitive, cap count/length. */
export function normalizeArticleTags(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const t of input) {
    if (typeof t !== 'string') continue
    const s = t.trim().slice(0, MAX_TAG_LEN)
    if (!s) continue
    const key = s.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
    if (out.length >= MAX_TAGS) break
  }
  return out
}
