export default defineNuxtRouteMiddleware(async (to) => {
  const authResponse = await $fetch<{ user?: { id?: string } }>("/api/auth/session", {
    method: "GET",
    credentials: "include",
  }).catch(() => null);

  const user = authResponse?.user;

  if (!user?.id) {
    const { openLogin } = useAuthModal();
    openLogin(to.fullPath);
    return abortNavigation();
  }
});
