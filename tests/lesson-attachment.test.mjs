import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { attachmentAfterRemove, canStartUpload, imageToDiscard } from '../shared/utils/lessonAttachment.mjs'

describe('lesson attachment while uploading', () => {
  it('keeps the saved file when a replacement is cancelled', () => {
    assert.deepEqual(
      attachmentAfterRemove({ uploading: true, url: 'https://files/old.pdf', name: 'old.pdf' }),
      { url: 'https://files/old.pdf', name: 'old.pdf' },
    )
  })

  it('clears a finished attachment', () => {
    assert.deepEqual(
      attachmentAfterRemove({ uploading: false, url: 'https://files/new.pdf', name: 'new.pdf' }),
      { url: '', name: '' },
    )
  })

  it('refuses another file while an upload or save is running', () => {
    assert.equal(canStartUpload({ loading: false, uploading: true }), false)
    assert.equal(canStartUpload({ loading: true, uploading: false }), false)
    assert.equal(canStartUpload({ loading: false, uploading: false }), true)
  })
})

describe('unsaved image discard', () => {
  it('discards an uploaded image when the dialog closes without saving', () => {
    assert.equal(imageToDiscard({
      sessionUrl: 'https://files/new.png',
      savedUrl: 'https://files/old.png',
      keepSession: false,
    }), 'https://files/new.png')
  })

  it('keeps the image after a successful save and never discards the saved one', () => {
    assert.equal(imageToDiscard({
      sessionUrl: 'https://files/new.png',
      savedUrl: 'https://files/old.png',
      keepSession: true,
    }), '')
    assert.equal(imageToDiscard({
      sessionUrl: 'https://files/old.png',
      savedUrl: 'https://files/old.png',
      keepSession: false,
    }), '')
  })
})
