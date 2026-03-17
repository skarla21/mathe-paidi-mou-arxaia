import { serverSupabaseAnon } from '../../utils/supabaseServer'

export default defineEventHandler(async () => {
  const supabase = serverSupabaseAnon()
  const { data, error } = await supabase.from('categories').select('*').order('order', { ascending: true })
  if (error) {
    console.error('[categories/index.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return data ?? []
})
