export function useAuthModal() {
  const isOpen = useState<boolean>('authModal.open', () => false)
  const activeTab = useState<'login' | 'register'>('authModal.tab', () => 'login')
  const loginSubView = useState<'form' | 'forgot'>('authModal.loginSubView', () => 'form')
  const pendingRedirect = useState<string | null>('authModal.redirect', () => null)

  function openLogin(redirectTo?: string) {
    pendingRedirect.value = redirectTo ?? null
    activeTab.value = 'login'
    loginSubView.value = 'form'
    isOpen.value = true
  }

  function openRegister(redirectTo?: string) {
    pendingRedirect.value = redirectTo ?? null
    activeTab.value = 'register'
    isOpen.value = true
  }

  function openForgot() {
    activeTab.value = 'login'
    loginSubView.value = 'forgot'
    isOpen.value = true
  }

  function backToLogin() {
    loginSubView.value = 'form'
  }

  function close() {
    isOpen.value = false
    pendingRedirect.value = null
    activeTab.value = 'login'
    loginSubView.value = 'form'
  }

  return { isOpen, activeTab, loginSubView, pendingRedirect, openLogin, openRegister, openForgot, backToLogin, close }
}
