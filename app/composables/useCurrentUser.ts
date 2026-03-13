export function useCurrentUser() {
  const session = useState<{
    user: { id: string; email?: string | null; isAdmin: boolean; name?: string | null; avatar_url?: string | null; provider?: string; created_at?: string | null } | null
  }>('current-user-session', () => ({ user: null }))

  const fetchSession = async () => {
    const result = await $fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    }).catch(() => ({ user: null, session: null }))

    session.value.user = (result as any)?.user ?? null
  }

  if (import.meta.client && session.value.user === null) {
    fetchSession()
  }

  const isAdmin = computed(() => session.value.user?.isAdmin === true)
  const isStudent = computed(() => !!session.value.user && !session.value.user.isAdmin)

  return {
    session,
    fetchSession,
    isAdmin,
    isStudent,
  }
}

