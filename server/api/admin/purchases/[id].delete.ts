import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing purchase id' })
  }

  const supabase = serverSupabaseService()

  const { error } = await supabase
    .from('purchases')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Delete purchase error:', error)
    throw createError({ statusCode: 500, message: 'Failed to revoke access' })
  }

  return { ok: true }
})
