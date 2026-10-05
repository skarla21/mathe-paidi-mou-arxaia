import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'
import { nextGradeSlug } from '../../utils/contentSlug'
import { withUniqueSlugRetry } from '../../utils/uniqueViolation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { name, order } = await readBody<{ name: string; order?: number }>(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Το όνομα είναι υποχρεωτικό' })
  const supabase = serverSupabaseService()
  const nameValue = name.trim()
  const { data, error } = await withUniqueSlugRetry(3, async () => {
    const slug = await nextGradeSlug(supabase, nameValue)
    return supabase.from('grades').insert({ name: nameValue, slug, order: order ?? 0 }).select().single()
  })
  if (error || !data) {
    console.error('[admin/grades.post]', error?.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  return data
})
