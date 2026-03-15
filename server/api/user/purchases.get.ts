import { requireAuth } from '../../utils/requireAuth'
import { serverSupabaseService } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const supabase = serverSupabaseService()

  const { data, error } = await supabase
    .from('purchases')
    .select('lesson_id, lessons(id, title, is_free, price)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return (data ?? []).map((p: any) => p.lessons).filter(Boolean)
})
