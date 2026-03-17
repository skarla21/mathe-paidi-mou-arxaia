import { serverSupabaseAnon } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing chapter id' })
  const supabase = serverSupabaseAnon()
  const { data, error } = await supabase.from('chapters').select('*').eq('id', id).single()
  if (error || !data) throw createError({ statusCode: 404, message: 'Chapter not found' })
  return data
})
