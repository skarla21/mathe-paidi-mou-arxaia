import { serverSupabaseService } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing category id' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('categories')
    .select('*, lessons(*)')
    .eq('id', id)
    .single()
  if (error || !data) throw createError({ statusCode: 404, message: 'Category not found' })
  return data
})
