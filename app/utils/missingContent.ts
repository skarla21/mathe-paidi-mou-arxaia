export function throwIfMissing(
  error: { statusCode?: number } | null | undefined,
  missing: boolean,
) {
  if (!error && !missing) return
  const status = error?.statusCode
  if (status && status >= 500) {
    throw createError({ statusCode: status, statusMessage: 'Κάτι πήγε στραβά', fatal: true })
  }
  throw createError({ statusCode: 404, statusMessage: 'Δεν βρέθηκε', fatal: true })
}
