import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{
    title: string; content?: string; is_free?: boolean; price?: number
    pdf_url?: string; order?: number
    chapter_id?: string | null; subject_id?: string | null; category_id?: string | null
  }>(event)
  if (!body.title?.trim()) throw createError({ statusCode: 400, message: 'Title is required' })
  const parentCount = [body.chapter_id, body.subject_id, body.category_id].filter(Boolean).length
  if (parentCount !== 1) {
    throw createError({ statusCode: 400, message: 'Exactly one of chapter_id, subject_id, or category_id is required' })
  }
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('lessons').insert({
    title: body.title.trim(),
    content: body.content ?? null,
    is_free: body.is_free ?? true,
    price: body.is_free ? 0 : (body.price ?? 0),
    pdf_url: body.pdf_url ?? null,
    order: body.order ?? 0,
    chapter_id: body.chapter_id ?? null,
    subject_id: body.subject_id ?? null,
    category_id: body.category_id ?? null,
  }).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
