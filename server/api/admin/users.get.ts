import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, "isAdmin", created_at, purchases(count), lesson_downloads(count)')
    .order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map((u: any) => ({
    ...u,
    purchaseCount: u.purchases?.[0]?.count ?? 0,
    downloadCount: u.lesson_downloads?.[0]?.count ?? 0,
  }))
})
