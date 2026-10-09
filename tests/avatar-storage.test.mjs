import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  avatarFilePath,
  avatarPathFromUrl,
  clearUserAvatar,
  replaceUserAvatar,
} from '../server/utils/avatarStorage.ts'

const userId = '11111111-1111-1111-1111-111111111111'
const otherId = '22222222-2222-2222-2222-222222222222'
const supabaseUrl = 'https://example.supabase.co'
const ownUrl = `${supabaseUrl}/storage/v1/object/public/uploads/avatars/${userId}/10.jpg`

describe('avatarPathFromUrl', () => {
  it('accepts this user\'s stored avatar', () => {
    assert.equal(avatarPathFromUrl(ownUrl, supabaseUrl, userId), `avatars/${userId}/10.jpg`)
    assert.equal(avatarPathFromUrl(`${ownUrl}?t=1`, supabaseUrl, userId), `avatars/${userId}/10.jpg`)
  })

  it('rejects another user, an outside host, and a traversal path', () => {
    assert.equal(avatarPathFromUrl(ownUrl, supabaseUrl, otherId), null)
    assert.equal(avatarPathFromUrl('https://lh3.googleusercontent.com/a/photo', supabaseUrl, userId), null)
    assert.equal(
      avatarPathFromUrl(`${supabaseUrl}/storage/v1/object/public/uploads/avatars/${userId}/../${otherId}/10.jpg`, supabaseUrl, userId),
      null,
    )
  })
})

describe('avatarFilePath', () => {
  it('keeps the file inside this user\'s folder', () => {
    assert.equal(avatarFilePath(userId, '10.jpg'), `avatars/${userId}/10.jpg`)
    assert.equal(avatarFilePath(userId, '../secret.jpg'), null)
    assert.equal(avatarFilePath('../' + otherId, '10.jpg'), null)
  })
})

function avatarUrl(fileName) {
  return `${supabaseUrl}/storage/v1/object/public/uploads/avatars/${userId}/${fileName}`
}

function fakeAvatar({
  avatarUrl: savedUrl = null,
  files = [],
  updateError = null,
  listError = null,
  removeError = null,
  readError = null,
  onList = null,
} = {}) {
  const state = {
    avatarUrl: savedUrl,
    files,
    removed: [],
    events: [],
  }
  const client = {
    from(table) {
      if (table !== 'users') throw new Error(`unexpected table ${table}`)
      const api = {
        select() {
          return api
        },
        eq() {
          return api
        },
        update(payload) {
          return {
            eq() {
              state.events.push('update')
              if (updateError) return Promise.resolve({ error: updateError })
              state.avatarUrl = payload.avatar_url
              return Promise.resolve({ error: null })
            },
          }
        },
        maybeSingle() {
          state.events.push('read')
          if (readError) return Promise.resolve({ data: null, error: readError })
          return Promise.resolve({ data: { avatar_url: state.avatarUrl }, error: null })
        },
      }
      return api
    },
    storage: {
      from() {
        return {
          list(folder, options = {}) {
            state.events.push('list')
            if (onList) onList(state)
            if (listError) return Promise.resolve({ data: null, error: listError })
            if (folder !== `avatars/${userId}`) {
              return Promise.resolve({ data: [], error: null })
            }
            const start = options.offset ?? 0
            const limit = options.limit ?? state.files.length
            return Promise.resolve({
              data: state.files.slice(start, start + limit),
              error: null,
            })
          },
          remove(paths) {
            state.events.push('remove')
            state.removed.push(...paths)
            if (removeError) return Promise.resolve({ error: removeError })
            return Promise.resolve({ error: null })
          },
        }
      },
    },
  }
  return { state, client }
}

describe('replaceUserAvatar', () => {
  it('keeps a newer saved file when an older upload finishes cleanup', async () => {
    const newer = avatarUrl('30.jpg')
    const supabase = fakeAvatar({
      files: [
        { name: '10.jpg', id: 'a' },
        { name: '20.jpg', id: 'b' },
        { name: '30.jpg', id: 'c' },
      ],
      onList(state) {
        state.avatarUrl = newer
      },
    })
    const result = await replaceUserAvatar(
      supabase.client,
      userId,
      avatarUrl('20.jpg'),
      `avatars/${userId}/20.jpg`,
      supabaseUrl,
    )
    assert.equal(result, 'ok')
    assert.deepEqual(supabase.state.removed, [`avatars/${userId}/10.jpg`])
  })

  it('leaves the saved photo in place when the database update fails', async () => {
    const supabase = fakeAvatar({
      avatarUrl: ownUrl,
      files: [{ name: '10.jpg', id: 'a' }, { name: '20.jpg', id: 'b' }],
      updateError: { message: 'db down' },
    })
    const result = await replaceUserAvatar(
      supabase.client,
      userId,
      avatarUrl('20.jpg'),
      `avatars/${userId}/20.jpg`,
      supabaseUrl,
    )
    assert.equal(result, 'db-failed')
    assert.equal(supabase.state.avatarUrl, ownUrl)
    assert.deepEqual(supabase.state.removed, [`avatars/${userId}/20.jpg`])
    assert.deepEqual(supabase.state.events, ['update', 'remove'])
  })

  it('reports the database failure when the new file cannot be deleted', async () => {
    const errors = []
    const original = console.error
    console.error = (...args) => errors.push(args.join(' '))
    try {
      const supabase = fakeAvatar({
        avatarUrl: ownUrl,
        updateError: { message: 'db down' },
        removeError: { message: 'storage down' },
      })
      const result = await replaceUserAvatar(
        supabase.client,
        userId,
        avatarUrl('20.jpg'),
        `avatars/${userId}/20.jpg`,
        supabaseUrl,
      )
      assert.equal(result, 'db-failed')
      assert.deepEqual(supabase.state.removed, [`avatars/${userId}/20.jpg`])
      assert.equal(errors.some((line) => line.includes('storage down')), true)
    } finally {
      console.error = original
    }
  })

  it('does not delete another user\'s file when the database update fails', async () => {
    const supabase = fakeAvatar({ updateError: { message: 'db down' } })
    const result = await replaceUserAvatar(
      supabase.client,
      userId,
      avatarUrl('20.jpg'),
      `avatars/${otherId}/secret.jpg`,
      supabaseUrl,
    )
    assert.equal(result, 'db-failed')
    assert.deepEqual(supabase.state.removed, [])
  })

  it('keeps the saved avatar when listing the folder fails', async () => {
    const supabase = fakeAvatar({
      files: [{ name: '10.jpg', id: 'a' }],
      listError: { message: 'list down' },
    })
    const result = await replaceUserAvatar(
      supabase.client,
      userId,
      avatarUrl('20.jpg'),
      `avatars/${userId}/20.jpg`,
      supabaseUrl,
    )
    assert.equal(result, 'ok')
    assert.equal(supabase.state.avatarUrl, avatarUrl('20.jpg'))
    assert.deepEqual(supabase.state.removed, [])
  })

  it('keeps the saved avatar when deleting old files fails', async () => {
    const supabase = fakeAvatar({
      files: [{ name: '10.jpg', id: 'a' }, { name: '20.jpg', id: 'b' }],
      removeError: { message: 'remove down' },
    })
    const result = await replaceUserAvatar(
      supabase.client,
      userId,
      avatarUrl('20.jpg'),
      `avatars/${userId}/20.jpg`,
      supabaseUrl,
    )
    assert.equal(result, 'ok')
    assert.equal(supabase.state.avatarUrl, avatarUrl('20.jpg'))
    assert.deepEqual(supabase.state.removed, [`avatars/${userId}/10.jpg`])
  })

  it('deletes nothing when the saved url on this project is not an avatar', async () => {
    const supabase = fakeAvatar({
      files: [{ name: '10.jpg', id: 'a' }, { name: '20.jpg', id: 'b' }],
      onList(state) {
        state.avatarUrl = `${supabaseUrl}/storage/v1/object/public/uploads/lesson-content/notes.pdf`
      },
    })
    const result = await replaceUserAvatar(
      supabase.client,
      userId,
      avatarUrl('20.jpg'),
      `avatars/${userId}/20.jpg`,
      supabaseUrl,
    )
    assert.equal(result, 'ok')
    assert.deepEqual(supabase.state.removed, [])
  })

  it('pages through the folder and skips a folder entry', async () => {
    const files = Array.from({ length: 101 }, (_, index) => ({
      name: `${index}.jpg`,
      id: `file-${index}`,
    }))
    files.push({ name: 'nested', id: null })
    const supabase = fakeAvatar({ files })
    const result = await replaceUserAvatar(
      supabase.client,
      userId,
      avatarUrl('0.jpg'),
      `avatars/${userId}/0.jpg`,
      supabaseUrl,
    )
    assert.equal(result, 'ok')
    assert.equal(supabase.state.events.filter((event) => event === 'list').length, 2)
    assert.equal(supabase.state.removed.includes(`avatars/${userId}/0.jpg`), false)
    assert.equal(supabase.state.removed.includes(`avatars/${userId}/nested`), false)
    assert.equal(supabase.state.removed.length, 100)
  })
})

describe('clearUserAvatar', () => {
  it('clears the database before deleting files', async () => {
    const supabase = fakeAvatar({
      avatarUrl: ownUrl,
      files: [{ name: '10.jpg', id: 'a' }],
    })
    const result = await clearUserAvatar(supabase.client, userId, supabaseUrl)
    assert.equal(result, 'ok')
    assert.equal(supabase.state.avatarUrl, null)
    assert.deepEqual(supabase.state.events, ['update', 'list', 'read', 'remove'])
    assert.deepEqual(supabase.state.removed, [`avatars/${userId}/10.jpg`])
  })

  it('keeps a file saved by a newer upload', async () => {
    const supabase = fakeAvatar({
      avatarUrl: ownUrl,
      files: [{ name: '10.jpg', id: 'a' }, { name: '30.jpg', id: 'c' }],
      onList(state) {
        state.avatarUrl = avatarUrl('30.jpg')
      },
    })
    const result = await clearUserAvatar(supabase.client, userId, supabaseUrl)
    assert.equal(result, 'ok')
    assert.deepEqual(supabase.state.removed, [`avatars/${userId}/10.jpg`])
  })

  it('deletes nothing when the database update fails', async () => {
    const supabase = fakeAvatar({
      avatarUrl: ownUrl,
      files: [{ name: '10.jpg', id: 'a' }],
      updateError: { message: 'db down' },
    })
    const result = await clearUserAvatar(supabase.client, userId, supabaseUrl)
    assert.equal(result, 'db-failed')
    assert.equal(supabase.state.avatarUrl, ownUrl)
    assert.deepEqual(supabase.state.events, ['update'])
  })

  it('does nothing for an unsafe user id', async () => {
    const supabase = fakeAvatar({
      avatarUrl: ownUrl,
      files: [{ name: '10.jpg', id: 'a' }],
    })
    const result = await clearUserAvatar(supabase.client, `../${otherId}`, supabaseUrl)
    assert.equal(result, 'db-failed')
    assert.deepEqual(supabase.state.events, [])
  })

  it('deletes storage files when the saved photo is a Google url', async () => {
    const supabase = fakeAvatar({
      avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
      files: [{ name: '10.jpg', id: 'a' }],
    })
    const result = await clearUserAvatar(supabase.client, userId, supabaseUrl)
    assert.equal(result, 'ok')
    assert.deepEqual(supabase.state.removed, [`avatars/${userId}/10.jpg`])
  })
})
