import { createClient } from '@supabase/supabase-js'

export function serverSupabaseService() {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.supabaseServiceKey as string
  if (!url || !key) {
    throw createError({ statusCode: 500, message: 'Supabase not configured' })
  }
  return createClient(url, key)
}

export function serverSupabaseAnon() {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.public.supabaseAnonKey as string
  if (!url || !key) {
    throw createError({ statusCode: 500, message: 'Supabase not configured' })
  }
  return createClient(url, key)
}
