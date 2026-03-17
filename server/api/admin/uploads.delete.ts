import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)

  if (!body?.path || typeof body.path !== 'string') {
    throw createError({ statusCode: 400, message: 'Missing file path' })
  }

  if (!body.path.startsWith('pdfs/') || body.path.includes('..')) {
    throw createError({ statusCode: 400, message: 'Invalid file path' })
  }

  const supabase = serverSupabaseService()

  const { error } = await supabase.storage
    .from('uploads')
    .remove([body.path])

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { ok: true }
})
