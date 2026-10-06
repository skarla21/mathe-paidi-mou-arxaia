import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

function read(path) {
  return readFileSync(join(here, path), 'utf8')
}

describe('profile edit route', () => {
  it('sends a guest to login and a signed-in user to the profile dialog', () => {
    const lesson = read('../app/components/lesson/LessonView.vue')
    assert.match(lesson, /fileBlock === 'sign-in'/)
    assert.match(lesson, /openLogin\(route\.fullPath\)/)
    assert.match(lesson, /Σύνδεση/)
    assert.match(lesson, /fileBlock === 'verify-email'/)
    assert.match(lesson, /openEditProfile/)
    assert.match(lesson, /Επεξεργασία προφίλ/)
    assert.doesNotMatch(lesson, /\/profile\/edit/)

    const lessonApi = read('../server/api/lessons/[id].get.ts')
    assert.match(lessonApi, /lessonFileBlock/)
  })

  it('lands email verification on the home page', () => {
    const handler = read('../server/api/auth/verify-email.get.ts')
    assert.match(handler, /\/\?emailVerification=ok/)
    assert.match(handler, /\/\?emailVerification=invalid_token/)
    assert.match(handler, /\/\?emailVerification=expired_token/)
    assert.match(handler, /\/\?emailVerification=unavailable/)
    assert.doesNotMatch(handler, /\/profile\/edit/)

    const layout = read('../app/layouts/default.vue')
    assert.match(layout, /acceptEmailVerification/)
    assert.match(layout, /emailVerificationFollowUp/)
    assert.match(layout, /openEditProfile\(\)/)
    assert.match(layout, /openLogin\(route\.fullPath\)/)
  })

  it('removes the profile pages and redirects their urls home', () => {
    assert.equal(existsSync(new URL('../app/pages/profile/edit.vue', import.meta.url)), false)
    assert.equal(existsSync(new URL('../app/pages/profile/index.vue', import.meta.url)), false)

    const config = read('../nuxt.config.ts')
    assert.match(config, /'\/profile': \{ redirect: '\/' \}/)
    assert.match(config, /'\/profile\/\*\*': \{ redirect: '\/' \}/)
  })
})
