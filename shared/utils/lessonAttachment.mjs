export function canStartUpload({ loading, uploading }) {
  return !loading && !uploading
}

export function attachmentAfterRemove({ uploading, url, name }) {
  if (uploading) return { url, name }
  return { url: '', name: '' }
}

export function imageToDiscard({ sessionUrl, savedUrl, keepSession }) {
  if (keepSession || !sessionUrl || sessionUrl === savedUrl) return ''
  return sessionUrl
}
