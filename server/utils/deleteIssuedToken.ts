import type { serverSupabaseService } from './supabaseServer'

type ServiceClient = ReturnType<typeof serverSupabaseService>
type TokenTable = 'password_reset_tokens' | 'verification_tokens'

export async function deleteIssuedToken(
  supabase: ServiceClient,
  table: TokenTable,
  tokenHash: string,
  logPrefix: string,
): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('token_hash', tokenHash)
  if (error) {
    console.error(`${logPrefix} Failed to roll back token:`, error.message)
  }
}
