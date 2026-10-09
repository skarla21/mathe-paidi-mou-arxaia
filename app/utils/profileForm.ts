export function profileNameAfterSession(
  draft: string,
  appliedServerName: string,
  serverName: string,
  opening: boolean,
): { draft: string; appliedServerName: string } {
  if (!opening && draft !== appliedServerName) {
    return { draft, appliedServerName }
  }
  return { draft: serverName, appliedServerName: serverName }
}

export function avatarPreviewAfterSession(
  preview: string | null,
  serverAvatar: string | null,
  opening: boolean,
): string | null {
  if (!opening && preview?.startsWith('blob:')) return preview
  return serverAvatar
}
