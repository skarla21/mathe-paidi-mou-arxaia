/**
 * Fetch wrapper for admin API calls. Always includes credentials so session cookies are sent.
 */
export function useAdminFetch() {
  return <T = unknown>(
    url: string,
    opts?: Parameters<typeof $fetch>[1],
  ): Promise<T> => $fetch<T>(url, { ...opts, credentials: 'include' })
}
