import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { safeStorageName } from '../server/utils/safeStorageName.ts'

function publicPath(name) {
  const url = new URL(encodeURI(`https://proj.supabase.co/storage/v1/object/public/uploads/lesson-content/1-${name}`))
  return { search: url.search, hash: url.hash, path: decodeURIComponent(url.pathname) }
}

describe('safeStorageName', () => {
  it('keeps the public URL path intact when the original name contains ? or #', () => {
    const name = safeStorageName('notes?v2#final.pdf')
    const parsed = publicPath(name)
    assert.equal(parsed.search, '')
    assert.equal(parsed.hash, '')
    assert.equal(parsed.path.endsWith(`/1-${name}`), true)
    assert.equal(name.includes('?'), false)
    assert.equal(name.includes('#'), false)
    assert.equal(name.endsWith('.pdf'), true)
  })

  it('uses an ascii fallback when the name has no latin letters or digits', () => {
    assert.equal(safeStorageName('Αρχαία.pdf'), 'file.pdf')
  })

  it('collapses slash traversal into a single file name', () => {
    const name = safeStorageName('../../secret.pdf')
    assert.equal(name.includes('/'), false)
    assert.equal(name.includes('\\'), false)
    assert.equal(name.endsWith('.pdf'), true)
  })
})
