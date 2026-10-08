import { loadAdminDownloads } from '../../utils/adminDownloads'
import { serverSupabaseService } from '../../utils/supabaseServer'

export default defineEventHandler((event) => {
  return loadAdminDownloads(event, serverSupabaseService())
})
