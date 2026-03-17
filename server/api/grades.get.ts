import { serverSupabaseAnon } from '../utils/supabaseServer'

export default defineEventHandler(async () => {
  const supabase = serverSupabaseAnon()
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .order('order', { ascending: true })
  if (error) {
    console.error('[grades.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return data ?? []
})
