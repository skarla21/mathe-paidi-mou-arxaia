import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{
    title: string; content?: string; is_free?: boolean
    pdf_url?: string; order?: number; course_id?: string | null; category_id?: string | null
  }>(event)
  if (!body.title?.trim()) throw createError({ statusCode: 400, message: 'Title is required' })
  if (body.course_id && body.category_id) {
    throw createError({ statusCode: 400, message: 'Cannot assign to both course and category' })
  }
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('lessons').insert({
    title: body.title.trim(),
    content: body.content ?? null,
    is_free: body.is_free ?? true,
    pdf_url: body.pdf_url ?? null,
    order: body.order ?? 0,
    course_id: body.course_id ?? null,
    category_id: body.category_id ?? null,
  }).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
