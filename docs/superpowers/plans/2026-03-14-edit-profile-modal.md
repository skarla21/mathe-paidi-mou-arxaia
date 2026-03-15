# Edit Profile Modal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the `/profile/edit` page into a modal dialog triggered from the user dropdown, and fix the 401 error on profile save and the buggy default avatar.

**Architecture:** A global `useEditProfileModal` composable (following the existing `useAuthModal` pattern) holds open/close state. `EditProfileModal.vue` at `app/components/` root wraps all existing form logic in a Dialog. `AppHeader.vue` buttons replace the old NuxtLinks. The `/profile/edit` page is deleted. The server auth middleware is fixed to pass only the cookie header to the Auth() call.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Tailwind CSS v4, shadcn-vue (Radix Vue), @auth/core, h3

**Spec:** `docs/superpowers/specs/2026-03-14-edit-profile-modal-design.md`

---

## File Map

| Action | Path | What it does |
|--------|------|--------------|
| Modify | `server/middleware/auth.context.ts` | Fix 401: pass only `cookie` header to Auth() |
| Modify | `app/locales/en.json` | Add `common.close` key |
| Modify | `app/locales/el.json` | Add `common.close` key |
| Create | `app/composables/useEditProfileModal.ts` | Global open/close state |
| Create | `app/components/EditProfileModal.vue` | Modal with the edit form |
| Modify | `app/layouts/default.vue` | Mount `<EditProfileModal />` |
| Modify | `app/layouts/admin.vue` | Mount `<EditProfileModal />` |
| Modify | `app/components/layout/AppHeader.vue` | Replace NuxtLinks with modal-opening buttons |
| Delete | `app/pages/profile/edit.vue` | Route no longer needed |

---

## Chunk 1: Server fix + i18n + composable

### Task 1: Fix the 401 — targeted cookie extraction in auth.context.ts

**File:** `server/middleware/auth.context.ts`

The current code casts all `event.node.req.headers` (which has `string | string[] | undefined` values) to `HeadersInit`. The `Headers` constructor may mangle or drop the `cookie` header when array-valued headers (like `set-cookie`) are present. The fix: pass only the single `cookie` string that Auth() actually needs.

- [ ] **Open** `server/middleware/auth.context.ts` and find the `new Request(...)` call (lines 11–14).

- [ ] **Replace** the headers line:

  **Before:**
  ```ts
  const authRequest = new Request(url.toString(), {
    method: "GET",
    headers: (event.node.req.headers as unknown) as HeadersInit,
  });
  ```

  **After:**
  ```ts
  const authRequest = new Request(url.toString(), {
    method: "GET",
    headers: {
      cookie: getRequestHeader(event, "cookie") ?? "",
    },
  });
  ```

  `getRequestHeader` is auto-imported by Nitro (from h3) — no import statement needed.

- [ ] **Verify** the file compiles: `npm run check`
  Expected: no new errors on this file.

- [ ] **Commit:**
  ```bash
  git add server/middleware/auth.context.ts
  git commit -m "fix(auth): pass only cookie header to Auth() in server middleware"
  ```

---

### Task 2: Add `common.close` i18n key

**Files:** `app/locales/en.json`, `app/locales/el.json`

`UiDialogClose` needs an accessible aria-label. The `common` section currently has only `loading` and `error`.

- [ ] **Edit** `app/locales/en.json` — find the existing `"common"` object (around line 82) and add `"close"` as a new key **inside** it. Do NOT create a second `"common"` block:

  ```json
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "close": "Close"
  },
  ```

- [ ] **Edit** `app/locales/el.json` — same: add `"close"` inside the existing `"common"` block. Preserve the other values exactly:

  ```json
  "common": {
    "loading": "Φόρτωση...",
    "error": "Κάτι πήγε στραβά",
    "close": "Κλείσιμο"
  },
  ```

- [ ] **Commit:**
  ```bash
  git add app/locales/en.json app/locales/el.json
  git commit -m "feat(i18n): add common.close key"
  ```

---

### Task 3: Create `useEditProfileModal` composable

**File:** `app/composables/useEditProfileModal.ts` (new file)

Mirrors `useAuthModal.ts` exactly — `useState` keeps the open flag in Nuxt's shared state, so any component (AppHeader, layouts, etc.) that calls `useEditProfileModal()` gets the same reactive value.

- [ ] **Create** `app/composables/useEditProfileModal.ts`:

  ```ts
  export function useEditProfileModal() {
    const isOpen = useState<boolean>('editProfileModal.open', () => false)
    const open = () => { isOpen.value = true }
    const close = () => { isOpen.value = false }
    return { isOpen, open, close }
  }
  ```

- [ ] **Run** `npm run check` — expected: passes with no errors.

- [ ] **Commit:**
  ```bash
  git add app/composables/useEditProfileModal.ts
  git commit -m "feat(profile): add useEditProfileModal composable"
  ```

---

## Chunk 2: EditProfileModal component

### Task 4: Create `EditProfileModal.vue`

**File:** `app/components/EditProfileModal.vue` (new file)

This is the heart of the feature. The form logic is moved verbatim from `app/pages/profile/edit.vue`. Key differences from the page:
- No `definePageMeta` or `useHead`
- Wraps content in the Dialog component suite
- Blob cleanup uses a `watch` on `isOpen` (modal is mounted in layout permanently — `onUnmounted` never fires)
- Close button uses `t('common.close')` for aria-label

The Dialog component suite lives at `app/components/ui/dialog/`:
- `Dialog.vue` — wraps Radix `DialogRoot` (accepts `:open` + `@update:open`)
- `DialogPortal.vue` — Radix portal
- `DialogOverlay.vue` — full-screen dark overlay
- `DialogContent.vue` — centered panel, default `max-w-lg` (we override to `max-w-2xl`)
- `DialogHeader.vue`, `DialogTitle.vue`, `DialogClose.vue` — composable header parts

- [ ] **Create** `app/components/EditProfileModal.vue` with this content:

  ```vue
  <script setup lang="ts">
  import { toast } from 'vue-sonner'
  import UiButton from '~/components/ui/Button.vue'
  import UiDialog from '~/components/ui/dialog/Dialog.vue'
  import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
  import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
  import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
  import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
  import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
  import UiDialogClose from '~/components/ui/dialog/DialogClose.vue'
  import UiCard from '~/components/ui/Card.vue'
  import UiCardContent from '~/components/ui/CardContent.vue'
  import UiInput from '~/components/ui/Input.vue'
  import UiLabel from '~/components/ui/Label.vue'

  const { isOpen, close } = useEditProfileModal()
  const { session, fetchSession } = useCurrentUser()
  const { t } = useI18n()

  const name = ref('')
  const avatarFile = ref<File | null>(null)
  const avatarPreview = ref<string | null>(null)
  const currentPassword = ref('')
  const newPassword = ref('')
  const confirmPassword = ref('')
  const loading = ref(false)

  const provider = computed(() => session.value.user?.provider ?? 'credentials')
  const isCredentials = computed(() => provider.value === 'credentials')

  const joinedAt = computed(() => {
    const raw = session.value.user?.created_at
    if (!raw) return ''
    return new Date(raw).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
  })

  // Populate form fields when modal opens or user changes
  watch(
    () => session.value.user,
    (user) => {
      if (user) {
        name.value = user.name ?? ''
        avatarPreview.value = user.avatar_url ?? null
      }
    },
    { immediate: true },
  )

  // Revoke blob URL when modal closes (modal is permanently mounted — onUnmounted never fires)
  watch(isOpen, (open) => {
    if (!open && avatarPreview.value?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview.value)
      avatarPreview.value = session.value.user?.avatar_url ?? null
      avatarFile.value = null
    }
  })

  function onAvatarClick() {
    document.getElementById('edit-profile-avatar-input')?.click()
  }

  function onAvatarChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(t('profile.edit.avatarTypeError'))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profile.edit.avatarSizeError'))
      return
    }
    if (avatarPreview.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
  }

  async function onSubmit() {
    if (isCredentials.value && newPassword.value) {
      if (newPassword.value.length < 8) {
        toast.error(t('profile.edit.passwordMin'))
        return
      }
      if (newPassword.value !== confirmPassword.value) {
        toast.error(t('profile.edit.passwordMismatch'))
        return
      }
    }

    loading.value = true
    try {
      if (avatarFile.value) {
        const formData = new FormData()
        formData.append('file', avatarFile.value)
        await $fetch<{ avatar_url: string }>('/api/user/avatar', { method: 'POST', body: formData, credentials: 'include' })
        avatarFile.value = null
      }

      const nameChanged = name.value.trim() !== (session.value.user?.name ?? '')
      const passwordChanged = isCredentials.value && newPassword.value.length > 0

      if (nameChanged || passwordChanged) {
        const body: Record<string, string | null> = {}
        if (nameChanged) body.name = name.value.trim() || null
        if (passwordChanged) {
          body.currentPassword = currentPassword.value
          body.newPassword = newPassword.value
        }
        await $fetch<{ id: string; email: string; name: string | null; avatar_url: string | null }>('/api/user/profile', { method: 'PATCH', body, credentials: 'include' })
      }

      await fetchSession()
      toast.success(t('profile.edit.success'))
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } catch (e: unknown) {
      const error = e as { data?: { statusCode?: number; message?: string } }
      const status = error?.data?.statusCode
      if (status === 400 && error?.data?.message?.includes('password')) {
        toast.error(t('profile.edit.passwordWrong'))
      } else {
        toast.error(t('common.error'))
      }
    } finally {
      loading.value = false
    }
  }
  </script>

  <template>
    <UiDialog :open="isOpen" @update:open="(v) => !v && close()">
      <UiDialogPortal>
        <UiDialogOverlay />
        <UiDialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">

          <UiDialogHeader class="flex items-center justify-between mb-4">
            <UiDialogTitle class="text-xl font-bold font-heading">
              {{ t('profile.edit.title') }}
            </UiDialogTitle>
            <UiDialogClose as-child>
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                :aria-label="t('common.close')"
              >
                <VIcon name="bi-x" class="size-5" aria-hidden="true" />
              </button>
            </UiDialogClose>
          </UiDialogHeader>

          <UiCard class="border-0 shadow-none p-0">
            <UiCardContent class="p-0">
              <form class="flex flex-col sm:flex-row gap-6" @submit.prevent="onSubmit">

                <!-- LEFT: avatar + account info -->
                <div class="flex flex-col gap-4 sm:w-48 shrink-0">

                  <!-- Avatar -->
                  <div class="flex flex-col items-center gap-3 rounded-lg border bg-card p-4">
                    <button
                      type="button"
                      class="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted hover:ring-2 hover:ring-primary/50 transition"
                      :aria-label="t('profile.edit.avatar')"
                      @click="onAvatarClick"
                    >
                      <img v-if="avatarPreview" :src="avatarPreview" alt="" class="size-full object-cover" >
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        width="44"
                        height="44"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        class="text-muted-foreground"
                      >
                        <circle cx="12" cy="8" r="4" fill="currentColor" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" />
                      </svg>
                      <span class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition text-white text-xs font-medium">
                        {{ t('profile.edit.avatar') }}
                      </span>
                    </button>
                    <input id="edit-profile-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onAvatarChange" >
                    <p class="text-center text-xs text-muted-foreground">{{ t('profile.edit.avatarHint') }}</p>
                  </div>

                  <!-- Account info (read-only) -->
                  <div class="rounded-lg border bg-muted/40 p-4 space-y-2.5 text-sm">
                    <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      {{ t('profile.edit.provider') }}
                    </p>
                    <div class="flex items-start gap-2 text-foreground">
                      <VIcon name="bi-envelope" class="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <span class="break-all text-xs">{{ session.user?.email }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-foreground">
                      <VIcon name="bi-gear" class="size-4 shrink-0 text-muted-foreground" />
                      <span class="text-xs">{{ isCredentials ? t('profile.edit.providerCredentials') : t('profile.edit.providerGoogle') }}</span>
                    </div>
                    <div v-if="joinedAt" class="flex items-center gap-2 text-foreground">
                      <VIcon name="bi-journal-bookmark" class="size-4 shrink-0 text-muted-foreground" />
                      <span class="text-xs">{{ t('profile.edit.joinedAt') }}: {{ joinedAt }}</span>
                    </div>
                  </div>
                </div>

                <!-- RIGHT: editable fields -->
                <div class="flex-1 space-y-6">
                  <div class="space-y-2">
                    <UiLabel for="ep-name">{{ t('profile.edit.name') }}</UiLabel>
                    <UiInput id="ep-name" v-model="name" type="text" />
                  </div>

                  <template v-if="isCredentials">
                    <div class="border-t pt-6 space-y-4">
                      <p class="text-sm font-semibold">{{ t('profile.edit.passwordSection') }}</p>
                      <div class="space-y-2">
                        <UiLabel for="ep-current-password">{{ t('profile.edit.currentPassword') }}</UiLabel>
                        <UiInput id="ep-current-password" v-model="currentPassword" type="password" autocomplete="current-password" />
                      </div>
                      <div class="space-y-2">
                        <UiLabel for="ep-new-password">{{ t('profile.edit.newPassword') }}</UiLabel>
                        <UiInput id="ep-new-password" v-model="newPassword" type="password" autocomplete="new-password" />
                      </div>
                      <div class="space-y-2">
                        <UiLabel for="ep-confirm-password">{{ t('profile.edit.confirmPassword') }}</UiLabel>
                        <UiInput id="ep-confirm-password" v-model="confirmPassword" type="password" autocomplete="new-password" />
                      </div>
                    </div>
                  </template>

                  <UiButton type="submit" class="w-full" :disabled="loading">
                    {{ loading ? t('common.loading') : t('profile.edit.save') }}
                  </UiButton>
                </div>

              </form>
            </UiCardContent>
          </UiCard>

        </UiDialogContent>
      </UiDialogPortal>
    </UiDialog>
  </template>
  ```

  > **Notes:**
  > - Input ids prefixed with `ep-` to avoid collisions with any other form on the page.
  > - `UiCard` with `border-0 shadow-none p-0` removes visual double-border since DialogContent already has a border.
  > - The avatar button now has `border-2 border-border` on the container — this is the gray border fix (option B).

- [ ] **Run** `npm run check` — expected: passes.

- [ ] **Commit:**
  ```bash
  git add app/components/EditProfileModal.vue
  git commit -m "feat(profile): create EditProfileModal component"
  ```

---

## Chunk 3: Integration — layouts, AppHeader, delete old page

### Task 5: Mount modal in both layouts

**Files:** `app/layouts/default.vue`, `app/layouts/admin.vue`

Nuxt auto-imports components — no import statement needed. The modal just needs to be present in the DOM tree so Radix Dialog's portal can attach. Follow the same pattern as `<AuthModal />` in `default.vue`.

- [ ] **Edit** `app/layouts/default.vue` — add `<EditProfileModal />` right after `<AuthModal />`:

  ```vue
  <template>
    <div class="min-h-screen flex flex-col bg-background text-foreground">
      <Toaster />
      <AuthModal />
      <EditProfileModal />        <!-- add this line -->
      <LayoutAppHeader />
      ...
  ```

- [ ] **Edit** `app/layouts/admin.vue` — add `<EditProfileModal />`. Open the file first to see its current structure; insert the tag in the top-level template element, before or after any existing layout components.

- [ ] **Run** `npm run check` — expected: passes.

- [ ] **Commit:**
  ```bash
  git add app/layouts/default.vue app/layouts/admin.vue
  git commit -m "feat(profile): mount EditProfileModal in layouts"
  ```

---

### Task 6: Wire AppHeader — replace NuxtLinks with modal triggers

**File:** `app/components/layout/AppHeader.vue`

There are two places where `/profile/edit` is linked:
1. **Desktop dropdown** — line ~207: `UiDropdownMenuItem > NuxtLink to="/profile/edit"`
2. **Mobile drawer** — line ~478: `NuxtLink to="/profile/edit"`

Both need to become buttons that call `useEditProfileModal().open()`.

- [ ] **Add** the composable call in `<script setup>` (near the top, after other composable calls):

  ```ts
  const { open: openEditProfile } = useEditProfileModal()
  ```

- [ ] **Replace** the desktop dropdown item (find the block with `to="/profile/edit"` inside `UiDropdownMenuContent`):

  **Before:**
  ```vue
  <UiDropdownMenuItem>
    <NuxtLink
      to="/profile/edit"
      class="flex items-center w-full"
    >
      <VIcon name="bi-pencil" class="mr-2 size-4 shrink-0" />
      {{ t("nav.editProfile") }}
    </NuxtLink>
  </UiDropdownMenuItem>
  ```

  **After:**
  ```vue
  <UiDropdownMenuItem @click="openEditProfile">
    <span class="flex items-center w-full">
      <VIcon name="bi-pencil" class="mr-2 size-4 shrink-0" />
      {{ t("nav.editProfile") }}
    </span>
  </UiDropdownMenuItem>
  ```

- [ ] **Replace** the mobile drawer link (find the block with `to="/profile/edit"` in the mobile section):

  **Before:**
  ```vue
  <NuxtLink
    to="/profile/edit"
    class="font-heading flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    @click="onMobileNavLink"
  >
    <VIcon
      name="bi-pencil"
      class="size-5 shrink-0"
      aria-hidden="true"
    />
    {{ t("nav.editProfile") }}
  </NuxtLink>
  ```

  **After:**
  ```vue
  <button
    type="button"
    class="font-heading flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
    @click="openEditProfile(); closeMobileMenu()"
  >
    <VIcon
      name="bi-pencil"
      class="size-5 shrink-0"
      aria-hidden="true"
    />
    {{ t("nav.editProfile") }}
  </button>
  ```

- [ ] **Run** `npm run check` — expected: passes.

- [ ] **Commit:**
  ```bash
  git add app/components/layout/AppHeader.vue
  git commit -m "feat(profile): open edit profile modal from header dropdown"
  ```

---

### Task 7: Delete the old profile edit page

**File:** `app/pages/profile/edit.vue` (delete)

This page is now fully replaced by the modal. Deleting it removes the `/profile/edit` route — visits to that URL will 404 (expected behaviour; the link was never public-facing).

- [ ] **Delete** the file:
  ```bash
  git rm app/pages/profile/edit.vue
  ```

- [ ] **Run** `npm run check` — expected: passes (no references to the deleted file remain).

- [ ] **Commit:**
  ```bash
  git commit -m "feat(profile): remove /profile/edit page (replaced by modal)"
  ```

---

### Task 8: Final verification

- [ ] Start dev server: `npm run dev`

- [ ] **Log in** → click your avatar in the navbar → click "Edit Profile" → confirm the modal opens centered on the page (not a navigation).

- [ ] **Navigate directly** to `http://localhost:3000/profile/edit` → confirm a 404 page.

- [ ] **Change your display name** → click Save → confirm success toast and the name updates in the header dropdown immediately.

- [ ] **Change password** (credentials user only): enter current password + new password + confirm → Save → success toast. Test wrong current password → error toast "Incorrect current password".

- [ ] **Google-login user**: password section should be hidden entirely.

- [ ] **Mobile**: open hamburger menu → tap "Edit Profile" → drawer closes and modal opens.

- [ ] **Avatar upload**: click avatar circle → pick an image → preview updates → Save → avatar persists after page reload.

- [ ] **Default avatar**: if no avatar is set, the modal shows a clean person silhouette with a visible gray border — no double-ring artifact.

- [ ] **Dismiss modal**: press Escape or click the X button → modal closes cleanly.

- [ ] **Run final check:** `npm run check` — must pass with zero errors.

- [ ] **Commit if any loose ends:** `git add -p && git commit -m "chore: final cleanup"`
