export default defineNuxtRouteMiddleware(async () => {
  const authResponse = await $fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'include',
  }).catch(() => null)

  const user = (authResponse as { user?: { isAdmin?: boolean } } | null)?.user
  const isAdmin = user?.isAdmin === true

  if (!isAdmin) {
    return navigateTo('/')
  }
})
