/** Minutes to read plain text; min 1. ~200 words per minute. */
export function readingTimeMinutesFromBody(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 1
  return Math.max(1, Math.ceil(words / 200))
}
