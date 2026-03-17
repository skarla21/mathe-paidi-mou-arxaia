import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, "isAdmin", created_at, purchases(count), downloads(count)')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[admin/users.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return (data ?? []).map((u: { purchases?: { count: number }[]; downloads?: { count: number }[]; [key: string]: unknown }) => ({
    ...u,
    purchaseCount: u.purchases?.[0]?.count ?? 0,
    downloadCount: u.downloads?.[0]?.count ?? 0,
  }))
})
