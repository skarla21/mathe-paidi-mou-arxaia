import { canStartUpload, imageToDiscard } from '#shared/utils/lessonAttachment.mjs'

type ImageEntity = 'category' | 'chapter' | 'subject'

export function useAdminImageDraft(entity: ImageEntity) {
  const adminFetch = useAdminFetch()
  const imageUrl = ref('')
  const savedUrl = ref('')
  const sessionUrl = ref('')
  const busy = ref(false)
  let keepSession = false
  const fileUpload = useAdminFileUpload()
  const uploading = computed(() => fileUpload.uploading.value || busy.value)

  function resetImage(url: string | null | undefined) {
    keepSession = false
    savedUrl.value = url ?? ''
    imageUrl.value = savedUrl.value
    sessionUrl.value = ''
  }

  function discard(url: string) {
    if (!url) return
    void adminFetch('/api/admin/upload-discard', {
      method: 'POST',
      body: { url },
    }).catch(() => {})
  }

  function releaseUnsaved() {
    const url = imageToDiscard({
      sessionUrl: sessionUrl.value,
      savedUrl: savedUrl.value,
      keepSession,
    })
    sessionUrl.value = ''
    if (url) discard(url)
  }

  function closeImage(saving: boolean) {
    fileUpload.abort()
    if (saving) return
    releaseUnsaved()
  }

  function keepImage() {
    if (sessionUrl.value && sessionUrl.value !== imageUrl.value) discard(sessionUrl.value)
    keepSession = true
    sessionUrl.value = ''
  }

  async function uploadImage(file: File, saving: boolean) {
    if (!canStartUpload({ loading: saving, uploading: uploading.value })) return
    busy.value = true
    const previous = sessionUrl.value
    try {
      const res = await fileUpload.upload(file, { kind: 'image', entity })
      if (!res?.url) return
      if (previous && previous !== res.url) discard(previous)
      imageUrl.value = res.url
      sessionUrl.value = res.url === savedUrl.value ? '' : res.url
    } finally {
      busy.value = false
    }
  }

  function clearImage() {
    const current = imageUrl.value
    imageUrl.value = ''
    if (!sessionUrl.value || sessionUrl.value !== current) return
    const url = sessionUrl.value
    sessionUrl.value = ''
    discard(url)
  }

  return {
    imageUrl,
    uploading,
    progress: fileUpload.progress,
    statusLabel: fileUpload.statusLabel,
    resetImage,
    closeImage,
    keepImage,
    releaseUnsaved,
    uploadImage,
    clearImage,
  }
}
