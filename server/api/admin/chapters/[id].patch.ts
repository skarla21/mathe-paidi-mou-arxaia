import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'
import { keepChapterSlug } from '../../../utils/contentSlug'
import { listEntityImageUrls, releaseReplacedEntityImage } from '../../../utils/entityImageStorage'
import { withUniqueSlugRetry } from '../../../utils/uniqueViolation'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Λείπει το αναγνωριστικό' })
  const body = await readBody<{
    title?: string; description?: string; subject_id?: string
    image_url?: string; order?: number
  }>(event)
  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.description !== undefined) updates.description = body.description || null
  if (body.image_url !== undefined) updates.image_url = body.image_url || null
  if (body.order !== undefined) updates.order = body.order
  const supabase = serverSupabaseService()
  let movedSubjectId: string | null = null
  let currentSlug = ''
  if (body.subject_id !== undefined) {
    const { data: subject } = await supabase.from('subjects').select('grade_id').eq('id', body.subject_id).single()
    if (!subject) throw createError({ statusCode: 400, message: 'Το μάθημα δεν βρέθηκε' })
    const { data: existing, error: existingError } = await supabase
      .from('chapters')
      .select('slug, subject_id')
      .eq('id', id)
      .maybeSingle()
    if (existingError || !existing) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
    updates.subject_id = body.subject_id
    updates.grade_id = subject.grade_id
    if (body.subject_id !== existing.subject_id) {
      movedSubjectId = body.subject_id
      currentSlug = existing.slug ?? ''
    }
  }
  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: 'Δεν υπάρχει κάτι για ενημέρωση' })
  let previousImageUrl: string | null = null
  if (body.image_url !== undefined) {
    const urls = await listEntityImageUrls(supabase, 'chapters', 'id', id)
    if (!urls) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
    previousImageUrl = urls[0] ?? null
  }
  const subjectId = movedSubjectId
  const { data, error } = subjectId
    ? await withUniqueSlugRetry(3, async () => {
        if (!subjectId) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
        const slug = await keepChapterSlug(supabase, currentSlug, subjectId, id)
        return supabase.from('chapters').update({ ...updates, slug }).eq('id', id).select().single()
      })
    : await supabase.from('chapters').update(updates).eq('id', id).select().single()
  if (error) {
    console.error('[admin/chapters/[id].patch]', error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  if (body.image_url !== undefined) {
    await releaseReplacedEntityImage(supabase, previousImageUrl, body.image_url || null)
  }
  return data
})
