export function purchaseCardState(url: string | null): { to: string | null; note: string | null } {
  if (url) return { to: url, note: null }
  return { to: null, note: 'Δεν υπάρχει δημόσια σελίδα για αυτό το υλικό.' }
}
