type WriteError = { code?: string; message?: string } | null

export function isUniqueViolation(error: WriteError): boolean {
  return error?.code === '23505'
}

export function isLessonSlugConflict(error: WriteError): boolean {
  return Boolean(error && error.code === '23505' && /lesson slug taken/i.test(error.message ?? ''))
}

export async function withUniqueSlugRetry<T>(
  attempts: number,
  run: () => Promise<{ data: T | null; error: WriteError }>,
): Promise<{ data: T | null; error: WriteError }> {
  let result: { data: T | null; error: WriteError } = { data: null, error: { message: 'Κάτι πήγε στραβά' } }
  const limit = Math.max(1, attempts)
  for (let attempt = 0; attempt < limit; attempt += 1) {
    result = await run()
    if (!result.error || !isUniqueViolation(result.error) || attempt === limit - 1) return result
  }
  return result
}
