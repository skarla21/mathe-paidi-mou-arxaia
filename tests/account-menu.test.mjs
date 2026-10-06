import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { twMerge } from 'tailwind-merge'
import {
  accountMenuDestructiveClass,
  accountMenuItemClass,
  adminPanelSubtitle,
  profileSubtitle,
  roleChipClass,
  studentMaterialSubtitle,
} from '../app/utils/accountMenu.ts'

const dropdownItemBase =
  'hover:bg-muted focus:bg-muted data-[highlighted]:bg-muted'

describe('account menu copy', () => {
  it('keeps the password subtitle for credentials accounts', () => {
    assert.equal(profileSubtitle('credentials'), 'Στοιχεία & κωδικός')
    assert.equal(profileSubtitle(undefined), 'Στοιχεία & κωδικός')
    assert.equal(profileSubtitle(null), 'Στοιχεία & κωδικός')
  })

  it('does not promise a password change for Google accounts', () => {
    assert.equal(profileSubtitle('google'), 'Στοιχεία λογαριασμού')
  })

  it('gives the admin item its own subtitle', () => {
    assert.notEqual(adminPanelSubtitle, studentMaterialSubtitle)
    assert.equal(adminPanelSubtitle, 'Υλικό & ρυθμίσεις')
  })
})

describe('account menu highlight', () => {
  it('replaces the base highlighted background', () => {
    const merged = twMerge(dropdownItemBase, accountMenuItemClass)
    assert.equal(merged.includes('data-[highlighted]:bg-muted'), false)
    assert.equal(merged.includes('data-[highlighted]:bg-secondary'), true)

    const destructive = twMerge(dropdownItemBase, accountMenuDestructiveClass)
    assert.equal(destructive.includes('data-[highlighted]:bg-muted'), false)
    assert.equal(destructive.includes('data-[highlighted]:bg-destructive/10'), true)
  })
})

describe('role chip', () => {
  it('uses the paired foreground on each fixed background', () => {
    assert.equal(roleChipClass(true), 'bg-amethyst-fixed text-amethyst-fixed-foreground')
    assert.equal(roleChipClass(false), 'bg-laurel-fixed text-laurel-fixed-foreground')
  })
})

describe('account menu template', () => {
  const header = readFileSync(new URL('../app/components/layout/AppHeader.vue', import.meta.url), 'utf8')

  it('uses the shared classes and copy', () => {
    assert.match(header, /accountMenuItemClass/)
    assert.match(header, /accountMenuDestructiveClass/)
    assert.match(header, /profileSubtitle\(session\.user\?\.provider\)/)
    assert.match(header, /adminPanelSubtitle/)
    assert.match(header, /studentMaterialSubtitle/)
    assert.match(header, /roleChipClass\(isAdmin\)/)
    assert.doesNotMatch(header, /data-highlighted:/)
    assert.doesNotMatch(header, /bg-laurel"/)
  })
})
