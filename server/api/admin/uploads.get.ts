import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()

  const { data, error } = await supabase.storage
    .from('uploads')
    .list('pdfs', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  const files = (data ?? [])
    .filter((f) => f.name && f.id)
    .map((f) => {
      const path = `pdfs/${f.name}`
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
      return {
        id: f.id,
        name: f.name,
        path,
        url: urlData.publicUrl,
        size: f.metadata?.size ?? 0,
        created_at: f.created_at,
      }
    })

  return files
})
