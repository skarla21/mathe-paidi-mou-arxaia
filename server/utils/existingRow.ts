import { createError } from 'h3'

export function requireExistingRow<T>(
  row: T | null,
  error: { message?: string } | null | undefined,
  logLabel: string,
  missingMessage: string,
): T {
  if (error) {
    console.error(logLabel, error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  if (!row) throw createError({ statusCode: 404, message: missingMessage })
  return row
}
