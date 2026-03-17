import { serverSupabaseAnon } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing category id' })
  const supabase = serverSupabaseAnon()
  const { data, error } = await supabase
    .from('categories')
    .select('*, lessons(id, title, description, order, is_free, chapter_id, subject_id, category_id, created_at)')
    .eq('id', id)
    .single()
  if (error || !data) throw createError({ statusCode: 404, message: 'Category not found' })
  return data
})
