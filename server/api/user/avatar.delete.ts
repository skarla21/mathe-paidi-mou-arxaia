import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAuth } from '../../utils/requireAuth'
import { clearUserAvatar } from '../../utils/avatarStorage'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const supabase = serverSupabaseService()
  const supabaseUrl = String(useRuntimeConfig().public.supabaseUrl || '')
  const cleared = await clearUserAvatar(supabase, userId, supabaseUrl)
  if (cleared === 'db-failed') {
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }

  return { avatar_url: null }
})
