export function safeStorageName(filename: string): string {
  const base = filename.normalize('NFC').replace(/[\\/]/g, '_').trim()
  const dot = base.lastIndexOf('.')
  const hasExt = dot >= 0 && dot < base.length - 1
  const rawStem = hasExt ? base.slice(0, dot) : base
  const rawExt = hasExt ? base.slice(dot + 1) : ''
  const clean = (value: string) =>
    value
      .replace(/[^A-Za-z0-9_.,'!&$@=;:+() *-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/\s+/g, ' ')
      .trim()
  let stem = clean(rawStem).replace(/\.+$/g, '').slice(0, 160)
  const ext = clean(rawExt).replace(/\./g, '').slice(0, 12)
  if (!/[A-Za-z0-9]/.test(stem)) stem = 'file'
  const name = ext ? `${stem}.${ext}` : stem
  return name.slice(0, 180)
}
