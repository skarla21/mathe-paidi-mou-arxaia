import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { legacyGradePath } from '../app/utils/legacyGradePath.ts'

describe('legacyGradePath', () => {
  it('keeps a normal grade path on this site', () => {
    assert.equal(legacyGradePath(['a-lykeiou']), '/a-lykeiou')
    assert.equal(legacyGradePath(['a-lykeiou', 'archaia', 'enotita']), '/a-lykeiou/archaia/enotita')
    assert.equal(legacyGradePath('a-lykeiou'), '/a-lykeiou')
  })

  it('drops empty segments from a double slash', () => {
    assert.equal(legacyGradePath(['a-lykeiou', '', 'archaia']), '/a-lykeiou/archaia')
  })

  it('returns null when there is nothing to redirect', () => {
    assert.equal(legacyGradePath(undefined), null)
    assert.equal(legacyGradePath(''), null)
    assert.equal(legacyGradePath([]), null)
    assert.equal(legacyGradePath(['']), null)
  })

  it('rejects a segment that could leave the site or break the redirect', () => {
    assert.equal(legacyGradePath(['//evil.example']), null)
    assert.equal(legacyGradePath(['a\\b']), null)
    assert.equal(legacyGradePath(['arch:aia']), null)
    assert.equal(legacyGradePath(['..']), null)
    assert.equal(legacyGradePath(['a-lykeiou', '..']), null)
    assert.equal(legacyGradePath(['a\nb']), null)
  })
})
