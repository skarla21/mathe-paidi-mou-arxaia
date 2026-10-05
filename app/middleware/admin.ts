export default defineNuxtRouteMiddleware(async () => {
  const requestFetch = useRequestFetch()
  const authResponse = await requestFetch<{ user?: { isAdmin?: boolean } }>(
    '/api/auth/session',
  ).catch(() => null)

  const isAdmin = authResponse?.user?.isAdmin === true

  if (!isAdmin) {
    return navigateTo('/')
  }
})
