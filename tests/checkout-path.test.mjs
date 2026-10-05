import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { lessonCheckoutPath } from '../server/utils/lessonCheckoutPath.ts'

describe('lessonCheckoutPath', () => {
  it('returns null when the lesson has no public path', () => {
    assert.equal(lessonCheckoutPath(new Map([['other', '/a-lykeiou/archaia']]), 'lesson-1'), null)
  })

  it('returns the canonical path used for the Stripe return', () => {
    const path = '/a-lykeiou/archaia/enotita/keimeno'
    assert.equal(lessonCheckoutPath(new Map([['lesson-1', path]]), 'lesson-1'), path)
  })

  it('refuses checkout when that path is missing', () => {
    const source = readFileSync(new URL('../server/api/stripe/checkout.post.ts', import.meta.url), 'utf8')
    assert.match(source, /lessonCheckoutPath/)
    assert.match(source, /statusCode: 409/)
    assert.match(source, /Το υλικό δεν έχει δημόσια διεύθυνση/)
    assert.doesNotMatch(source, /\/lesson\/\$\{/)
  })
})
