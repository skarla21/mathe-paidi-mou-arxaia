import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{
    title: string; description?: string; subject_id: string
    image_url?: string; order?: number
  }>(event)
  if (!body.title?.trim() || !body.subject_id) throw createError({ statusCode: 400, message: 'title and subject_id required' })
  const supabase = serverSupabaseService()
  const { data: subject } = await supabase.from('subjects').select('grade_id').eq('id', body.subject_id).single()
  if (!subject) throw createError({ statusCode: 400, message: 'Subject not found' })
  const { data, error } = await supabase.from('chapters').insert({
    title: body.title.trim(),
    description: body.description ?? null,
    subject_id: body.subject_id,
    grade_id: subject.grade_id,
    image_url: body.image_url ?? null,
    order: body.order ?? 0,
  }).select().single()
  if (error) {
    console.error('[admin/chapters.post]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return data
})
