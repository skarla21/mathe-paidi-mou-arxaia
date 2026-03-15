export function useAuthModal() {
  const isOpen = useState<boolean>('authModal.open', () => false)
  const activeTab = useState<'login' | 'register'>('authModal.tab', () => 'login')
  const pendingRedirect = useState<string | null>('authModal.redirect', () => null)

  function openLogin(redirectTo?: string) {
    pendingRedirect.value = redirectTo ?? null
    activeTab.value = 'login'
    isOpen.value = true
  }

  function openRegister(redirectTo?: string) {
    pendingRedirect.value = redirectTo ?? null
    activeTab.value = 'register'
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    pendingRedirect.value = null
    activeTab.value = 'login'
  }

  return { isOpen, activeTab, pendingRedirect, openLogin, openRegister, close }
}
