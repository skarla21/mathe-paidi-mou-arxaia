import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf']

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const formData = await readMultipartFormData(event)
  if (!formData?.length) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }
  const file = formData.find((f) => f.name === 'file' && f.data)
  if (!file?.data || !file.filename) {
    throw createError({ statusCode: 400, message: 'Invalid file' })
  }
  if (!ALLOWED_TYPES.includes(file.type || '')) {
    throw createError({ statusCode: 400, message: 'Only PDF allowed' })
  }
  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, message: 'File too large (max 10MB)' })
  }
  const supabase = serverSupabaseService()
  const path = `pdfs/${Date.now()}-${file.filename}`
  const { data: upload, error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(path, file.data, { contentType: file.type || 'application/pdf', upsert: false })
  if (uploadError) {
    throw createError({ statusCode: 500, message: uploadError.message })
  }
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(upload.path)
  return { path: upload.path, url: urlData.publicUrl }
})
