import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{
    title: string; description?: string; subject_id: string
    is_free?: boolean; price?: number; thumbnail_url?: string
  }>(event)
  if (!body.title?.trim() || !body.subject_id) throw createError({ statusCode: 400, message: 'title and subject_id required' })
  const supabase = serverSupabaseService()
  const { data: subject } = await supabase.from('subjects').select('grade_id').eq('id', body.subject_id).single()
  if (!subject) throw createError({ statusCode: 400, message: 'Subject not found' })
  const { data, error } = await supabase.from('courses').insert({
    title: body.title.trim(),
    description: body.description ?? null,
    subject_id: body.subject_id,
    grade_id: subject.grade_id,
    is_free: body.is_free ?? true,
    price: body.is_free ? 0 : (body.price ?? 0),
    thumbnail_url: body.thumbnail_url ?? null,
  }).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
