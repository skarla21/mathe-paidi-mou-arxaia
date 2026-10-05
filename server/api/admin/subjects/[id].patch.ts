import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'
import { keepSubjectSlug } from '../../../utils/contentSlug'
import { withUniqueSlugRetry } from '../../../utils/uniqueViolation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Λείπει το αναγνωριστικό' })
  const body = await readBody<{ name?: string; grade_id?: string; image_url?: string }>(event)
  const updates: Record<string, unknown> = {}
  const supabase = serverSupabaseService()
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.image_url !== undefined) updates.image_url = body.image_url || null
  let movedGradeId: string | null = null
  let currentSlug = ''
  if (body.grade_id !== undefined) {
    const { data: existing, error: existingError } = await supabase
      .from('subjects')
      .select('slug, grade_id')
      .eq('id', id)
      .maybeSingle()
    if (existingError || !existing) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
    updates.grade_id = body.grade_id
    if (body.grade_id !== existing.grade_id) {
      movedGradeId = body.grade_id
      currentSlug = existing.slug ?? ''
    }
  }
  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: 'Δεν υπάρχει κάτι για ενημέρωση' })
  const gradeId = movedGradeId
  const saved = gradeId
    ? await withUniqueSlugRetry(3, async () => {
        if (!gradeId) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
        const slug = await keepSubjectSlug(supabase, currentSlug, gradeId, id)
        return supabase.from('subjects').update({ ...updates, slug }).eq('id', id).select().single()
      })
    : await supabase.from('subjects').update(updates).eq('id', id).select().single()
  const { data, error } = saved
  if (error) {
    console.error('[admin/subjects/[id].patch]', error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  return data
})
