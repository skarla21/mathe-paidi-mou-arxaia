export default defineNuxtRouteMiddleware(async () => {
  const requestFetch = useRequestFetch()
  const authResponse = await requestFetch<{ user?: { id?: string } }>(
    '/api/auth/session',
  ).catch(() => null)

  if (authResponse?.user?.id) {
    return navigateTo('/')
  }
})
