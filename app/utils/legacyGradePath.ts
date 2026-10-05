function unsafeSegment(part: string): boolean {
  if (part === '.' || part === '..') return true
  for (const char of part) {
    const code = char.charCodeAt(0)
    if (code <= 31 || code === 127) return true
    if (char === '/' || char === '\\' || char === ':') return true
  }
  return false
}

export function legacyGradePath(segments: unknown): string | null {
  const parts = Array.isArray(segments)
    ? segments
    : segments == null || segments === ''
      ? []
      : [segments]
  const cleaned: string[] = []
  for (const part of parts) {
    if (typeof part !== 'string' || part.length === 0) continue
    if (unsafeSegment(part)) return null
    cleaned.push(part)
  }
  if (cleaned.length === 0) return null
  return `/${cleaned.join('/')}`
}
