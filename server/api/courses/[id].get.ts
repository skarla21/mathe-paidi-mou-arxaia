import { serverSupabaseService } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing course id' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).single()
  if (error || !data) throw createError({ statusCode: 404, message: 'Course not found' })
  return data
})
