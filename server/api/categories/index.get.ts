import { serverSupabaseService } from '../../utils/supabaseServer'

export default defineEventHandler(async () => {
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('categories').select('*').order('order', { ascending: true })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
