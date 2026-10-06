export const MAX_PDF_BYTES = 50 * 1024 * 1024
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
export const LESSON_MIMES = ['application/pdf', 'image/jpeg', 'image/png']
export const IMAGE_MIMES = ['image/jpeg', 'image/png']

export function maxBytesForMime(mime) {
  return mime === 'application/pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES
}

export function uploadPercent(loaded, total) {
  if (!Number.isFinite(loaded) || !Number.isFinite(total) || total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((loaded / total) * 100)))
}

export function formatUploadMegabytes(bytes) {
  const safe = Number.isFinite(bytes) && bytes > 0 ? bytes : 0
  const text = (safe / (1024 * 1024)).toLocaleString('el-GR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return `${text} MB`
}

export function formatUploadStatus({ checking, progress, loaded, total }) {
  if (checking) return 'Έλεγχος αρχείου…'
  return `${uploadPercent(progress, 100)}% · ${formatUploadMegabytes(loaded)} / ${formatUploadMegabytes(total)}`
}
