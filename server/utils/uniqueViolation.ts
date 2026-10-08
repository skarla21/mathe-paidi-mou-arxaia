type WriteError = { code?: string; message?: string } | null | undefined

export function isUniqueViolation(error: WriteError): boolean {
  return error?.code === '23505'
}

export function isLessonSlugConflict(error: WriteError): boolean {
  return Boolean(error && error.code === '23505' && /lesson slug taken/i.test(error.message ?? ''))
}

const FOLDED_NAME_INDEXES = [
  'subjects_grade_name_folded_key',
  'chapters_subject_title_folded_key',
]

export function isFoldedNameConflict(error: WriteError): boolean {
  if (!isUniqueViolation(error)) return false
  const message = error?.message ?? ''
  return FOLDED_NAME_INDEXES.some((name) => message.includes(name))
}

export async function withUniqueSlugRetry<T>(
  attempts: number,
  run: () => Promise<{ data: T | null; error: WriteError }>,
): Promise<{ data: T | null; error: WriteError }> {
  let result: { data: T | null; error: WriteError } = { data: null, error: { message: 'Κάτι πήγε στραβά' } }
  const limit = Math.max(1, attempts)
  for (let attempt = 0; attempt < limit; attempt += 1) {
    result = await run()
    if (!result.error || !isUniqueViolation(result.error) || isFoldedNameConflict(result.error) || attempt === limit - 1) return result
  }
  return result
}
