import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'
import { listEntityImageUrls, releaseEntityImages } from '../../../utils/entityImageStorage'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Λείπει το αναγνωριστικό' })
  const supabase = serverSupabaseService()
  const subjectImages = await listEntityImageUrls(supabase, 'subjects', 'id', id)
  const chapterImages = await listEntityImageUrls(supabase, 'chapters', 'subject_id', id)
  if (!subjectImages || !chapterImages) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) {
    console.error('[admin/subjects/[id].delete]', error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  await releaseEntityImages(supabase, [...subjectImages, ...chapterImages])
  return { ok: true }
})
