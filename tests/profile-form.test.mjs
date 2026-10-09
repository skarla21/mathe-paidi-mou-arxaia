import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { avatarPreviewAfterSession, profileNameAfterSession } from '../app/utils/profileForm.ts'

describe('profileNameAfterSession', () => {
  it('keeps a typed name when the session refreshes', () => {
    assert.deepEqual(
      profileNameAfterSession('Νέο', 'Παλιό', 'Παλιό', false),
      { draft: 'Νέο', appliedServerName: 'Παλιό' },
    )
  })

  it('follows the server name when the field is unchanged', () => {
    assert.deepEqual(
      profileNameAfterSession('Παλιό', 'Παλιό', 'Άλλο', false),
      { draft: 'Άλλο', appliedServerName: 'Άλλο' },
    )
  })

  it('replaces a typed name when the dialog opens', () => {
    assert.deepEqual(
      profileNameAfterSession('Νέο', 'Παλιό', 'Παλιό', true),
      { draft: 'Παλιό', appliedServerName: 'Παλιό' },
    )
  })
})

describe('avatarPreviewAfterSession', () => {
  it('keeps a local preview while an upload is in progress', () => {
    assert.equal(
      avatarPreviewAfterSession('blob:http://local/1', 'https://cdn.example/old.jpg', false),
      'blob:http://local/1',
    )
  })

  it('shows the saved photo when the dialog opens', () => {
    assert.equal(
      avatarPreviewAfterSession('blob:http://local/1', 'https://cdn.example/old.jpg', true),
      'https://cdn.example/old.jpg',
    )
  })

  it('shows the server photo after the local preview is gone', () => {
    assert.equal(avatarPreviewAfterSession('https://cdn.example/old.jpg', null, false), null)
  })
})
