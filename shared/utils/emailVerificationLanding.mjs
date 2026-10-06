const EMAIL_VERIFICATION_STATUSES = ['ok', 'invalid_token', 'expired_token', 'unavailable']

export function acceptEmailVerification(queryStatus, handledStatus) {
  if (typeof queryStatus !== 'string') return null
  if (!EMAIL_VERIFICATION_STATUSES.includes(queryStatus)) return null
  if (queryStatus === handledStatus) return null
  return queryStatus
}

export function emailVerificationFollowUp(status, isLoggedIn) {
  if (!EMAIL_VERIFICATION_STATUSES.includes(status)) return null
  if (status === 'ok') {
    return { toast: 'success', message: 'Email επαληθεύτηκε', open: null }
  }
  const invalid = status === 'invalid_token' || status === 'expired_token'
  return {
    toast: 'error',
    message: invalid
      ? 'Αυτός ο σύνδεσμος επαλήθευσης δεν είναι έγκυρος ή έχει λήξει.'
      : 'Δεν ήταν δυνατή η επαλήθευση του email. Παρακαλώ δοκίμασε ξανά.',
    open: isLoggedIn ? 'profile' : 'login',
  }
}
