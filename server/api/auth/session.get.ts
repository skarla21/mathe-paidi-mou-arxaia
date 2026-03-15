import { Auth } from '@auth/core'
import type { Session } from '@auth/core/types'
import { getAuthOptions } from "../../utils/authOptions";
import { serverSupabaseService } from "../../utils/supabaseServer";

export default defineEventHandler(async (event) => {
  const authOptions = getAuthOptions()
  const request = event.node.req
  const url = new URL('/api/auth/session', `https://${request.headers.host}`)

  const authRequest = new Request(url.toString(), {
    method: 'GET',
    headers: request.headers as unknown as HeadersInit,
  })

  const response = await Auth(authRequest, authOptions)

  if (!response.ok) {
    return { user: null, session: null }
  }

  const session = (await response.json()) as Session | null

  if (!session?.user) {
    return { user: null, session: null }
  }

  const user = session.user as Session['user'] & { id?: string; isAdmin?: boolean; name?: string | null; avatar_url?: string | null }

  const userId = user.id ?? ''
  let created_at: string | null = null
  let provider: string = 'credentials'

  let name: string | null = user.name ?? null
  let avatar_url: string | null = user.avatar_url ?? null

  if (userId) {
    const supabase = serverSupabaseService()
    const { data: dbUser } = await supabase
      .from('users')
      .select('created_at, provider, name, avatar_url')
      .eq('id', userId)
      .single()
    if (dbUser) {
      created_at = dbUser.created_at ?? null
      provider = dbUser.provider ?? 'credentials'
      name = dbUser.name ?? name
      avatar_url = dbUser.avatar_url ?? avatar_url
    }
  }

  return {
    user: {
      id: userId,
      isAdmin: user.isAdmin ?? false,
      email: user.email,
      name,
      avatar_url,
      created_at,
      provider,
    },
    session,
  }
})
