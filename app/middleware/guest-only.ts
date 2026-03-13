export default defineNuxtRouteMiddleware(async () => {
  const authResponse = await $fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'include',
  }).catch(() => null)

  const user = (authResponse as { user?: { id?: string } } | null)?.user

  if (user?.id) {
    return navigateTo('/')
  }
})

