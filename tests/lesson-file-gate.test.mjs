import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { lessonFileBlock } from '../shared/utils/lessonFileBlock.mjs'

const freeFile = { canAccess: true, canAccessContent: false, hasContent: true }
const paidFile = { canAccess: false, canAccessContent: false, hasContent: true }

describe('lessonFileBlock', () => {
  it('asks a guest on a free lesson to sign in', () => {
    assert.equal(lessonFileBlock({ ...freeFile, isLoggedIn: false }), 'sign-in')
  })

  it('asks a signed-in user with an unverified email to edit their profile', () => {
    assert.equal(lessonFileBlock({ ...freeFile, isLoggedIn: true }), 'verify-email')
  })

  it('shows no gate when the file can be opened', () => {
    assert.equal(lessonFileBlock({
      canAccess: true,
      canAccessContent: true,
      hasContent: true,
      isLoggedIn: true,
    }), null)
  })

  it('asks for a purchase when the lesson is paid', () => {
    assert.equal(lessonFileBlock({ ...paidFile, isLoggedIn: false }), 'purchase')
    assert.equal(lessonFileBlock({ ...paidFile, isLoggedIn: true }), 'purchase')
  })

  it('shows no gate when the lesson has no file', () => {
    assert.equal(lessonFileBlock({
      canAccess: true,
      canAccessContent: false,
      hasContent: false,
      isLoggedIn: false,
    }), null)
  })
})
