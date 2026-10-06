export function lessonFileBlock({ canAccess, canAccessContent, hasContent, isLoggedIn }) {
  if (!hasContent || canAccessContent) return null
  if (canAccess) return isLoggedIn ? 'verify-email' : 'sign-in'
  return 'purchase'
}
