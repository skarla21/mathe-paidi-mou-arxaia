import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { extensionForMime, safeStorageName, storedFileName } from '../server/utils/safeStorageName.ts'

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

  it('turns a Greek file name into an ELOT slug', () => {
    assert.equal(safeStorageName('Αρχαία Ελληνικά.pdf'), 'archaia-ellinika.pdf')
  })

  it('turns an English file name into kebab case', () => {
    assert.equal(safeStorageName('Ancient Greek Grammar.pdf'), 'ancient-greek-grammar.pdf')
  })

  it('uses the mime type when the file name has no extension', () => {
    assert.equal(extensionForMime('image/jpeg'), 'jpg')
    assert.equal(extensionForMime('image/png'), 'png')
    assert.equal(extensionForMime('application/pdf'), 'pdf')
    assert.equal(storedFileName('photo', 'image/jpeg', 'abcd1234'), 'photo-abcd1234.jpg')
    assert.equal(storedFileName('notes.pdf', 'application/pdf', 'abcd1234'), 'notes-abcd1234.pdf')
  })

  it('collapses slash traversal into a single file name', () => {
    const name = safeStorageName('../../secret.pdf')
    assert.equal(name.includes('/'), false)
    assert.equal(name.includes('\\'), false)
    assert.equal(name.endsWith('.pdf'), true)
  })
})
