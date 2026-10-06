import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { acceptEmailVerification, emailVerificationFollowUp } from '../shared/utils/emailVerificationLanding.mjs'

describe('acceptEmailVerification', () => {
  it('accepts each known status once', () => {
    for (const status of ['ok', 'invalid_token', 'expired_token', 'unavailable']) {
      assert.equal(acceptEmailVerification(status, null), status)
    }
  })

  it('ignores an unknown status, a repeated status, and a non-string query', () => {
    assert.equal(acceptEmailVerification('verified', null), null)
    assert.equal(acceptEmailVerification('ok', 'ok'), null)
    assert.equal(acceptEmailVerification(['ok'], null), null)
    assert.equal(acceptEmailVerification(undefined, null), null)
  })

  it('accepts a new status after a different one was handled', () => {
    assert.equal(acceptEmailVerification('expired_token', 'ok'), 'expired_token')
  })
})

describe('emailVerificationFollowUp', () => {
  it('confirms success without opening a dialog', () => {
    assert.deepEqual(emailVerificationFollowUp('ok', false), {
      toast: 'success',
      message: 'Email επαληθεύτηκε',
      open: null,
    })
    assert.deepEqual(emailVerificationFollowUp('ok', true), {
      toast: 'success',
      message: 'Email επαληθεύτηκε',
      open: null,
    })
  })

  it('opens the profile dialog for a signed-in user with a bad link', () => {
    for (const status of ['invalid_token', 'expired_token']) {
      assert.deepEqual(emailVerificationFollowUp(status, true), {
        toast: 'error',
        message: 'Αυτός ο σύνδεσμος επαλήθευσης δεν είναι έγκυρος ή έχει λήξει.',
        open: 'profile',
      })
    }
    assert.equal(emailVerificationFollowUp('unavailable', true).open, 'profile')
    assert.equal(
      emailVerificationFollowUp('unavailable', true).message,
      'Δεν ήταν δυνατή η επαλήθευση του email. Παρακαλώ δοκίμασε ξανά.',
    )
  })

  it('opens login for a signed-out user with a bad link', () => {
    for (const status of ['invalid_token', 'expired_token', 'unavailable']) {
      assert.equal(emailVerificationFollowUp(status, false).open, 'login')
      assert.equal(emailVerificationFollowUp(status, false).toast, 'error')
    }
  })
})
