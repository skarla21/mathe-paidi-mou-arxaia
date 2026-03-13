# Header, Auth Flow & Edit Profile — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign AppHeader (language flags + theme toggle always visible, new avatar dropdown for auth/unauth), fix the auth flow toasts (login success, logout success, specific error messages), and fully rebuild the Edit Profile page (two-column layout, password change support).

**Architecture:** AppHeader is split into permanent controls (search, lang flags, theme toggle) and a context-sensitive avatar dropdown. Auth state is passed via `useState('pendingToast')` instead of URL query params. Edit Profile uses two independent API calls — one for name/password, one for avatar — and calls `fetchSession()` after save to update the header live.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Tailwind CSS v4, shadcn-vue (DropdownMenu, AlertDialog), oh-vue-icons (Bootstrap set), vue-sonner toasts, custom `useI18n()` + `useTheme()` + `useCurrentUser()` composables, Supabase (service role), bcrypt.

**Spec:** `docs/superpowers/specs/2026-03-11-header-admin-profile-design.md` §1–4, §9–10
**Out of scope (see Plan 2):** §5–8 Admin Panel + DB schema migrations

**Key pre-existing keys in `en.json` (do NOT duplicate):**
- `auth.login.success` = "Signed in" — reused as login success toast
- `auth.logout.success` = "Signed out" — reused as logout success toast
- `auth.register.success` = "Account created..." — already used by register flow
- `auth.login.error.generic` = "Unable to login" — already exists

---

## File Map

| File | Action | What changes |
|---|---|---|
| `supabase/schema.sql` | Modify | Add `users.provider` column migration |
| `app/layouts/default.vue` | Modify | Replace query-toast watcher with `useState('pendingToast')` handler |
| `app/pages/login.vue` | Modify | Use `useState('pendingToast')`, map error codes to specific messages |
| `app/pages/register.vue` | Modify | Use `useState('pendingToast')` if it uses query param |
| `app/composables/useI18n.ts` | Possibly modify | Expose `locale` ref if not already returned |
| `app/plugins/oh-vue-icons.ts` | Modify | Add `BiPersonPlus` icon |
| `app/components/layout/AppHeader.vue` | Rewrite | Lang flags + theme toggle in header; new auth-aware avatar dropdown; logout toast included |
| `server/api/user/profile.patch.ts` | Modify | Add `currentPassword` + `newPassword` handling with bcrypt |
| `app/pages/profile/edit.vue` | Rewrite | Two-column layout, password change section, account info card |
| `app/locales/en.json` | Modify | Add new i18n keys (see Task 4) |
| `app/locales/el.json` | Modify | Add new i18n keys in Greek |

---

## Chunk 1: Auth Flow

### Task 1: Add `users.provider` column migration

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Append migration to schema.sql**

Open `supabase/schema.sql` and add at the bottom:

```sql
-- Migration: add provider to users (tracks auth method: 'credentials' | 'google')
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS provider text DEFAULT 'credentials';
```

- [ ] **Step 2: Run in Supabase SQL editor**

Paste the `ALTER TABLE` statement into the Supabase dashboard SQL editor and execute it. Verify the `users` table now has a `provider` column (default `'credentials'`).

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add users.provider column for auth method tracking"
```

---

### Task 2: Switch post-login toast from query param to `useState`

**Files:**
- Modify: `app/pages/login.vue`
- Modify: `app/layouts/default.vue`
- Possibly modify: `app/pages/register.vue`

Context: `default.vue` currently watches `route.query.toast` for `'login'` and `'registered'`. Both will be replaced with a `useState('pendingToast')` approach to keep URLs clean. The `auth.login.success` key ("Signed in") already exists and is kept.

- [ ] **Step 1: Inspect register.vue's redirect logic**

Read `app/pages/register.vue` fully. Find where it calls `navigateTo`. If it passes `?toast=registered`, you will apply the same useState swap below. If it fires `toast.success` directly without a redirect, leave it alone.

- [ ] **Step 2: Update `login.vue` — use useState and map error codes**

In `app/pages/login.vue`, add the following at the top of `<script setup>`:

```ts
const pendingToast = useState<string | null>('pendingToast', () => null)
```

Replace the `onSubmit` function:

```ts
const onSubmit = async () => {
  loading.value = true
  try {
    const { csrfToken } = await $fetch<{ csrfToken: string }>('/api/auth/csrf', {
      credentials: 'include',
    })

    const result = await $fetch<{ url?: string }>('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'X-Auth-Return-Redirect': '1' },
      body: { email: email.value, password: password.value, csrfToken, callbackUrl: '/' },
      credentials: 'include',
    })

    const redirectUrl = result?.url ?? ''

    if (redirectUrl.includes('error=') || redirectUrl.includes('/error')) {
      const urlParams = new URLSearchParams(redirectUrl.split('?')[1] ?? '')
      const errorCode = urlParams.get('error') ?? ''
      const errorMap: Record<string, string> = {
        CredentialsSignin: t('auth.login.error.invalidCredentials'),
        OAuthAccountNotLinked: t('auth.login.error.oauthNotLinked'),
      }
      toast.error(errorMap[errorCode] ?? t('auth.login.error.generic'))
      return
    }

    pendingToast.value = 'login'
    await navigateTo('/')
  } catch (e: any) {
    toast.error(e?.data?.message ?? e?.message ?? t('auth.login.error.generic'))
  } finally {
    loading.value = false
  }
}
```

- [ ] **Step 3: Update register.vue (if it uses query param)**

If register.vue redirects with `?toast=registered`, replace that navigation with:

```ts
const pendingToast = useState<string | null>('pendingToast', () => null)
// in onSubmit success block:
pendingToast.value = 'registered'
await navigateTo('/login')  // or wherever register redirects
```

- [ ] **Step 4: Update `default.vue` — replace query watcher with useState handler**

In `app/layouts/default.vue`:

1. Remove the entire `watch(() => route.query.toast, ...)` block.
2. Remove the `const route = useRoute()` line if it's no longer used elsewhere.
3. Import `toast` from `vue-sonner` at the top if not already imported.
4. Add to the existing `onMounted` callback (after `theme.init()` and `initI18n()`):

```ts
const { t } = useI18n()
const pendingToast = useState<string | null>('pendingToast', () => null)

onMounted(() => {
  theme.init()
  initI18n()

  const pending = pendingToast.value
  if (pending) {
    pendingToast.value = null  // clear BEFORE firing to avoid double-trigger
    if (pending === 'login') toast.success(t('auth.login.successToast'))
    else if (pending === 'registered') toast.success(t('auth.register.success'))
  }
})
```

Note: `auth.register.success` already exists in `en.json` — do not add it again. `auth.login.successToast` is NEW and is added in Task 3.

- [ ] **Step 5: Verify in browser**

1. `npm run dev`
2. Log in with valid credentials → redirects to `/` (URL has NO query params) → "Welcome back!" toast fires
3. Reload → no toast fires again (state was cleared)
4. Log in with wrong password → stays on `/login` → toast shows "Email or password is incorrect"
5. Log in with unknown error → toast shows the generic "Unable to login" message
6. Register (if applicable) → "Account created..." toast fires without URL params

- [ ] **Step 6: Commit**

```bash
git add app/pages/login.vue app/pages/register.vue app/layouts/default.vue
git commit -m "feat: replace query-param toasts with useState, add specific login error messages"
```

---

### Task 3: Add new i18n keys

**Files:**
- Modify: `app/locales/en.json`
- Modify: `app/locales/el.json`
- Modify: `public/locales/en.json` (server-side copy — must be kept in sync)
- Modify: `public/locales/el.json` (server-side copy — must be kept in sync)

- [ ] **Step 1: Add keys to `app/locales/en.json`**

Add to the `"nav"` object (do NOT touch existing keys):

```json
"myCourses": "My Courses",
"register": "Register",
"user": "User",
"userMenu": "User menu"
```

Add to `"auth.login.error"` (alongside the existing `"generic"` key):

```json
"invalidCredentials": "Email or password is incorrect",
"oauthNotLinked": "This email is already registered with a different login method"
```

Add to `"auth.login"` (alongside existing keys):

```json
"successToast": "Welcome back!"
```

Add to `"auth.logoutConfirm"` (alongside existing `"title"`, `"description"`, `"confirm"`, `"cancel"` keys):

```json
"successToast": "You have been logged out"
```

Add a new top-level `"header"` object:

```json
"header": {
  "languageEl": "Switch to Greek",
  "languageEn": "Switch to English",
  "toggleTheme": "Toggle theme"
}
```

Add to `"profile.edit"` (alongside existing name/avatar/save/success keys):

```json
"passwordSection": "Change Password",
"currentPassword": "Current password",
"newPassword": "New password",
"confirmPassword": "Confirm new password",
"provider": "Login method",
"joinedAt": "Member since",
"providerCredentials": "Email & password",
"providerGoogle": "Google account",
"passwordMismatch": "Passwords do not match",
"passwordWrong": "Current password is incorrect",
"passwordMin": "Password must be at least 8 characters",
"avatarTypeError": "Only JPEG, PNG and WebP images are allowed",
"avatarSizeError": "Image must be smaller than 2 MB"
```

Add to `"common"` (alongside existing `"loading"` key):

```json
"error": "Something went wrong"
```

- [ ] **Step 2: Add Greek translations to `app/locales/el.json`**

Add the exact same keys to `el.json` with Greek values:

```json
// nav additions:
"myCourses": "Τα μαθήματά μου",
"register": "Εγγραφή",
"user": "Χρήστης",
"userMenu": "Μενού χρήστη"

// auth.login.error additions:
"invalidCredentials": "Λάθος email ή κωδικός",
"oauthNotLinked": "Αυτό το email χρησιμοποιείται με διαφορετικό τρόπο σύνδεσης"

// auth.login addition:
"successToast": "Καλώς ήρθατε!"

// auth.logoutConfirm addition:
"successToast": "Αποσυνδεθήκατε"

// header (new section):
"header": {
  "languageEl": "Εναλλαγή σε Ελληνικά",
  "languageEn": "Εναλλαγή σε Αγγλικά",
  "toggleTheme": "Εναλλαγή θέματος"
}

// profile.edit additions:
"passwordSection": "Αλλαγή κωδικού",
"currentPassword": "Τρέχων κωδικός",
"newPassword": "Νέος κωδικός",
"confirmPassword": "Επιβεβαίωση νέου κωδικού",
"provider": "Τρόπος σύνδεσης",
"joinedAt": "Μέλος από",
"providerCredentials": "Email & κωδικός",
"providerGoogle": "Λογαριασμός Google",
"passwordMismatch": "Οι κωδικοί δεν ταιριάζουν",
"passwordWrong": "Λάθος τρέχων κωδικός",
"passwordMin": "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες",
"avatarTypeError": "Επιτρέπονται μόνο εικόνες JPEG, PNG και WebP",
"avatarSizeError": "Η εικόνα πρέπει να είναι μικρότερη από 2 MB"

// common additions:
"error": "Κάτι πήγε στραβά"
```

- [ ] **Step 3: Mirror changes to `public/locales/`**

The `public/locales/` directory contains server-side copies of the locale files. Apply the exact same key additions to `public/locales/en.json` and `public/locales/el.json`.

- [ ] **Step 4: Commit**

```bash
git add app/locales/en.json app/locales/el.json public/locales/en.json public/locales/el.json
git commit -m "feat: add i18n keys for header, profile edit, auth toasts, and error messages"
```

---

## Chunk 2: AppHeader Redesign

### Task 4: Check and update `useI18n` composable for locale exposure

**Files:**
- Read + possibly modify: `app/composables/useI18n.ts`

The language flag buttons need to know which locale is currently active to highlight it. The `useI18n` composable must expose a `locale` ref.

- [ ] **Step 1: Read `useI18n.ts` and check what it returns**

Open `app/composables/useI18n.ts`. Look for a returned `locale` value (a ref or computed containing `'el'` or `'en'`).

**If `locale` is already returned:** skip to Step 3.

**If `locale` is NOT returned:** the composable likely stores the locale internally via `useState`. Find the internal state variable (e.g., `const locale = useState('locale', () => 'el')`), and add it to the return object:

```ts
// In the return statement of the composable, add:
return {
  t,
  setLocale,
  locale,  // add this
  // ...other existing returns
}
```

- [ ] **Step 2: Add `BiPersonPlus` to oh-vue-icons plugin**

Open `app/plugins/oh-vue-icons.ts`. Add `BiPersonPlus` to the import and `addIcons` call:

```ts
import {
  // ...existing imports...
  BiPersonPlus,
} from 'oh-vue-icons/icons/bi'

addIcons(
  // ...existing icons...
  BiPersonPlus,
)
```

- [ ] **Step 3: Commit**

```bash
git add app/composables/useI18n.ts app/plugins/oh-vue-icons.ts
git commit -m "feat: expose locale from useI18n, add BiPersonPlus icon"
```

---

### Task 5: Rewrite AppHeader

**Files:**
- Rewrite: `app/components/layout/AppHeader.vue`

Full replacement. Includes: language flags, theme toggle inline, new auth-aware avatar dropdown, logout success toast. The existing GSAP logo hover (`iconWiggle`) is preserved unchanged.

Note: Task 5 fully replaces the file, so there is no separate "add logout toast" step — it is included in the rewrite below.

- [ ] **Step 1: Write the new AppHeader**

Replace `app/components/layout/AppHeader.vue` entirely:

```vue
<script setup lang="ts">
import { toast } from 'vue-sonner'
import { NuxtLink } from '#components'
import LayoutNotesDropdown from '~/components/layout/NotesDropdown.vue'
import SearchGlobalSearch from '~/components/search/GlobalSearch.vue'
import UiButton from '~/components/ui/Button.vue'
import UiDropdownMenu from '~/components/ui/dropdown-menu/DropdownMenu.vue'
import UiDropdownMenuTrigger from '~/components/ui/dropdown-menu/DropdownMenuTrigger.vue'
import UiDropdownMenuContent from '~/components/ui/dropdown-menu/DropdownMenuContent.vue'
import UiDropdownMenuItem from '~/components/ui/dropdown-menu/DropdownMenuItem.vue'
import UiAlertDialogRoot from '~/components/ui/alert-dialog/AlertDialogRoot.vue'
import UiAlertDialogPortal from '~/components/ui/alert-dialog/AlertDialogPortal.vue'
import UiAlertDialogOverlay from '~/components/ui/alert-dialog/AlertDialogOverlay.vue'
import UiAlertDialogContent from '~/components/ui/alert-dialog/AlertDialogContent.vue'
import UiAlertDialogHeader from '~/components/ui/alert-dialog/AlertDialogHeader.vue'
import UiAlertDialogFooter from '~/components/ui/alert-dialog/AlertDialogFooter.vue'
import UiAlertDialogTitle from '~/components/ui/alert-dialog/AlertDialogTitle.vue'
import UiAlertDialogDescription from '~/components/ui/alert-dialog/AlertDialogDescription.vue'
import UiAlertDialogCancel from '~/components/ui/alert-dialog/AlertDialogCancel.vue'
import UiAlertDialogAction from '~/components/ui/alert-dialog/AlertDialogAction.vue'

const { toggle, colorMode } = useTheme()
const { t, setLocale, locale } = useI18n()
const { session, isAdmin } = useCurrentUser()

const logoRef = ref<HTMLElement | null>(null)
const logoutDialogOpen = ref(false)

function onLogoHover() {
  if (import.meta.client && logoRef.value) {
    const { iconWiggle } = useGsapReveal()
    iconWiggle(logoRef.value)
  }
}

function openLogoutDialog() {
  logoutDialogOpen.value = true
}

async function confirmLogout() {
  try {
    await $fetch('/api/signout', { method: 'POST' })
  } catch {
    // ignore errors — sign out regardless
  }
  toast.success(t('auth.logoutConfirm.successToast'))
  await navigateTo('/')
}
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-header-border bg-header-bg/95 backdrop-blur-sm shadow-sm transition-colors duration-500"
  >
    <div class="container flex h-16 sm:h-20 items-center gap-4 px-4 sm:px-6">

      <!-- Logo -->
      <NuxtLink
        to="/"
        class="flex items-center gap-2 shrink-0 text-foreground transition-colors group/logo"
        @mouseenter="onLogoHover"
      >
        <span
          ref="logoRef"
          class="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          aria-hidden="true"
        >
          <VIcon name="bi-journal-bookmark-fill" class="size-5" />
        </span>
        <span class="font-heading font-bold text-lg sm:text-xl leading-tight group-hover/logo:text-primary transition-colors">
          {{ t('brand.logo') }}
        </span>
      </NuxtLink>

      <!-- Centre nav -->
      <nav class="hidden md:flex items-center gap-6 lg:gap-8 flex-1 justify-center">
        <NuxtLink
          to="/"
          class="font-heading flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground nav-link-underline transition-colors"
        >
          <VIcon name="bi-house-door" class="size-4" aria-hidden="true" />
          {{ t('nav.main') }}
        </NuxtLink>
        <LayoutNotesDropdown />
        <NuxtLink
          to="/about"
          class="font-heading flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground nav-link-underline transition-colors"
        >
          <VIcon name="bi-info-circle" class="size-4" aria-hidden="true" />
          {{ t('nav.about') }}
        </NuxtLink>
      </nav>

      <!-- Right controls -->
      <div class="flex items-center gap-2 shrink-0">

        <!-- Search -->
        <SearchGlobalSearch class="w-48 lg:w-64" />

        <!-- Language flags -->
        <div class="flex items-center gap-0.5 rounded-lg bg-muted px-2 py-1.5">
          <button
            type="button"
            class="text-base leading-none px-0.5 transition-opacity"
            :class="locale === 'el' ? 'opacity-100' : 'opacity-30 hover:opacity-70'"
            :aria-label="t('header.languageEl')"
            @click="setLocale('el')"
          >🇬🇷</button>
          <button
            type="button"
            class="text-base leading-none px-0.5 transition-opacity"
            :class="locale === 'en' ? 'opacity-100' : 'opacity-30 hover:opacity-70'"
            :aria-label="t('header.languageEn')"
            @click="setLocale('en')"
          >🇬🇧</button>
        </div>

        <!-- Theme toggle -->
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5 transition-colors hover:bg-muted/80"
          :aria-label="t('header.toggleTheme')"
          @click="toggle"
        >
          <VIcon name="bi-sun-fill" class="size-3.5 text-yellow-500" aria-hidden="true" />
          <div
            class="relative h-4 w-7 rounded-full transition-colors"
            :class="colorMode === 'dark' ? 'bg-primary' : 'bg-border'"
          >
            <span
              class="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform"
              :class="colorMode === 'dark' ? 'translate-x-3.5' : 'translate-x-0.5'"
            />
          </div>
          <VIcon name="bi-moon-fill" class="size-3.5 text-blue-400" aria-hidden="true" />
        </button>

        <!-- Avatar button + dropdown -->
        <ClientOnly>
          <UiDropdownMenu>
            <UiDropdownMenuTrigger as-child>
              <button
                type="button"
                class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-muted ring-offset-background transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                :aria-label="t('nav.userMenu')"
              >
                <img
                  v-if="session.user?.avatar_url"
                  :src="session.user.avatar_url"
                  :alt="session.user?.name ?? ''"
                  class="size-full object-cover"
                />
                <span v-else class="flex size-full items-center justify-center rounded-full bg-primary/15 text-primary">
                  <VIcon name="bi-person-circle" class="size-6" aria-hidden="true" />
                </span>
              </button>
            </UiDropdownMenuTrigger>

            <UiDropdownMenuContent align="end" class="min-w-52">

              <!-- AUTHENTICATED -->
              <template v-if="session.user">
                <!-- User info header (non-interactive) -->
                <div class="flex items-center gap-3 px-3 py-2.5 border-b border-border">
                  <div class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    <img
                      v-if="session.user.avatar_url"
                      :src="session.user.avatar_url"
                      :alt="session.user.name ?? ''"
                      class="size-full object-cover"
                    />
                    <VIcon v-else name="bi-person-circle" class="size-5 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium leading-none">{{ session.user.name ?? t('nav.user') }}</p>
                    <p class="truncate text-xs text-muted-foreground mt-0.5">{{ session.user.email }}</p>
                  </div>
                </div>

                <!-- Nav links -->
                <div class="py-1 border-b border-border">
                  <UiDropdownMenuItem>
                    <NuxtLink to="/profile/edit" class="flex items-center w-full">
                      <VIcon name="bi-pencil" class="mr-2 size-4 shrink-0" />
                      {{ t('nav.editProfile') }}
                    </NuxtLink>
                  </UiDropdownMenuItem>
                  <UiDropdownMenuItem>
                    <NuxtLink to="/dashboard" class="flex items-center w-full">
                      <VIcon name="bi-journal-bookmark" class="mr-2 size-4 shrink-0" />
                      {{ t('nav.myCourses') }}
                    </NuxtLink>
                  </UiDropdownMenuItem>
                </div>

                <!-- Admin (admins only) -->
                <div v-if="isAdmin" class="py-1 border-b border-border">
                  <UiDropdownMenuItem>
                    <NuxtLink to="/admin" class="flex items-center w-full">
                      <VIcon name="bi-gear" class="mr-2 size-4 shrink-0" />
                      {{ t('nav.adminPanel') }}
                    </NuxtLink>
                  </UiDropdownMenuItem>
                </div>

                <!-- Logout -->
                <div class="py-1">
                  <UiDropdownMenuItem @click="openLogoutDialog">
                    <VIcon name="bi-box-arrow-right" class="mr-2 size-4 shrink-0" />
                    {{ t('nav.logout') }}
                  </UiDropdownMenuItem>
                </div>
              </template>

              <!-- UNAUTHENTICATED -->
              <template v-else>
                <div class="py-1">
                  <UiDropdownMenuItem>
                    <NuxtLink to="/login" class="flex items-center w-full">
                      <VIcon name="bi-person-circle" class="mr-2 size-4 shrink-0" />
                      {{ t('nav.login') }}
                    </NuxtLink>
                  </UiDropdownMenuItem>
                  <UiDropdownMenuItem>
                    <NuxtLink to="/register" class="flex items-center w-full">
                      <VIcon name="bi-person-plus" class="mr-2 size-4 shrink-0" />
                      {{ t('nav.register') }}
                    </NuxtLink>
                  </UiDropdownMenuItem>
                </div>
              </template>

            </UiDropdownMenuContent>
          </UiDropdownMenu>

          <!-- Logout confirmation dialog -->
          <UiAlertDialogRoot v-model:open="logoutDialogOpen">
            <UiAlertDialogPortal>
              <UiAlertDialogOverlay />
              <UiAlertDialogContent>
                <UiAlertDialogHeader>
                  <UiAlertDialogTitle>{{ t('auth.logoutConfirm.title') }}</UiAlertDialogTitle>
                  <UiAlertDialogDescription>{{ t('auth.logoutConfirm.description') }}</UiAlertDialogDescription>
                </UiAlertDialogHeader>
                <UiAlertDialogFooter>
                  <UiAlertDialogCancel>
                    <UiButton variant="outline">{{ t('auth.logoutConfirm.cancel') }}</UiButton>
                  </UiAlertDialogCancel>
                  <UiAlertDialogAction as-child>
                    <UiButton variant="destructive" @click="confirmLogout">
                      {{ t('auth.logoutConfirm.confirm') }}
                    </UiButton>
                  </UiAlertDialogAction>
                </UiAlertDialogFooter>
              </UiAlertDialogContent>
            </UiAlertDialogPortal>
          </UiAlertDialogRoot>

          <template #fallback>
            <button
              type="button"
              class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-muted"
              aria-label="User menu"
            >
              <VIcon name="bi-person-circle" class="size-6 text-muted-foreground" aria-hidden="true" />
            </button>
          </template>
        </ClientOnly>

      </div>
    </div>
  </header>
</template>

<style scoped>
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: opacity 0.2s ease;
}
.theme-icon-enter-from,
.theme-icon-leave-to {
  opacity: 0;
}
</style>
```

- [ ] **Step 2: Verify in browser**

1. `npm run dev`
2. **Unauthenticated:** right side shows search → 🇬🇷/🇬🇧 flags → sun/moon toggle → avatar circle
3. Click avatar → dropdown shows Login + Register only
4. Click 🇬🇧 flag → highlights, language switches to English; click 🇬🇷 → switches back
5. Click theme toggle → pill moves, theme changes
6. **Authenticated:** log in → avatar shows photo or initials
7. Click avatar → shows user name + email at top, Edit Profile, My Courses, (Admin Panel if admin), Logout
8. Click Logout → confirmation dialog → confirm → "Signed out" toast → dropdown reverts to Login/Register

- [ ] **Step 3: Commit**

```bash
git add app/components/layout/AppHeader.vue
git commit -m "feat: redesign AppHeader with language flags, theme toggle, and new avatar dropdown"
```

---

## Chunk 3: Edit Profile Page Redesign

### Task 6: Extend `/api/user/profile` PATCH with password change

**Files:**
- Modify: `server/api/user/profile.patch.ts`

- [ ] **Step 1: Find the password hashing library in use**

```bash
grep -E '"bcrypt|"argon|"password-hash' package.json
```

Also read `server/api/auth/register.post.ts` to see exactly how passwords are hashed (which import, which function). Use the same library and the same number of salt rounds.

- [ ] **Step 2: Replace `profile.patch.ts`**

Replace `server/api/user/profile.patch.ts` with the following (adjusting the import and hash function to match what you found in Step 1 — example uses `bcryptjs`):

```ts
import bcrypt from 'bcryptjs'  // replace with actual package if different
import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAuth } from '../../utils/requireAuth'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)

  const body = await readBody<{
    name?: string | null
    currentPassword?: string
    newPassword?: string
  }>(event).catch(() => ({} as Record<string, unknown>))

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Invalid body' })
  }

  const supabase = serverSupabaseService()
  const updates: { name?: string | null; password_hash?: string } = {}

  // Name update
  if (typeof body.name === 'string') {
    updates.name = body.name.trim() || null
  }

  // Password change
  if (body.currentPassword !== undefined || body.newPassword !== undefined) {
    if (!body.currentPassword || !body.newPassword) {
      throw createError({ statusCode: 400, message: 'Both currentPassword and newPassword are required' })
    }
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
      throw createError({ statusCode: 400, message: 'New password must be at least 8 characters' })
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      throw createError({ statusCode: 500, message: 'Failed to fetch user' })
    }
    if (!user.password_hash) {
      throw createError({ statusCode: 400, message: 'This account uses Google login and has no password' })
    }

    const valid = await bcrypt.compare(body.currentPassword as string, user.password_hash)
    if (!valid) {
      throw createError({ statusCode: 400, message: 'Current password is incorrect' })
    }

    updates.password_hash = await bcrypt.hash(body.newPassword as string, 12)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No valid fields to update' })
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, email, name, avatar_url')
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
```

- [ ] **Step 3: Verify the API**

With the dev server running, manually test with a network request tool or browser devtools:
- PATCH `/api/user/profile` `{ name: "Test" }` → 200 with updated user object
- PATCH `{ currentPassword: "wrong", newPassword: "newpass123" }` → 400 `"Current password is incorrect"`
- PATCH `{ currentPassword: "correct", newPassword: "short" }` → 400 `"at least 8 characters"`
- PATCH `{ currentPassword: "correct", newPassword: "validpass123" }` → 200

- [ ] **Step 4: Commit**

```bash
git add server/api/user/profile.patch.ts
git commit -m "feat: extend profile PATCH with password change (bcrypt verify + hash)"
```

---

### Task 7: Redesign Edit Profile page

**Files:**
- Rewrite: `app/pages/profile/edit.vue`

Note: `/api/user/avatar` (POST) already works correctly — it uploads to Supabase Storage bucket `uploads` at path `avatars/{userId}/{timestamp}.{ext}`. No changes needed to that endpoint.

- [ ] **Step 1: Embed `created_at` in the JWT session**

The `joinedAt` date shown on the profile page comes from `users.created_at`. This field is NOT a standard JWT claim and won't be present in `session.user` from `@auth/core` unless it's explicitly embedded in the JWT callback.

Read `server/utils/authOptions.ts`. Find the `jwt` callback (it receives a `token` and optionally a `user` object on first sign-in). Add `created_at` to the token on the initial sign-in:

```ts
// Inside the jwt callback:
async jwt({ token, user }) {
  if (user) {
    // 'user' is present only on initial sign-in
    token.id = user.id
    token.isAdmin = (user as any).isAdmin
    token.created_at = (user as any).created_at ?? null
  }
  return token
},
```

Then in the `session` callback, expose it on `session.user`:

```ts
async session({ session, token }) {
  if (token && session.user) {
    session.user.id = token.id as string
    session.user.isAdmin = token.isAdmin as boolean
    ;(session.user as any).created_at = token.created_at ?? null
  }
  return session
},
```

After this change, `session.user.created_at` will be populated for all new sign-ins. Existing sessions won't have it until re-login (the `joinedAt` computed returns `''` gracefully when the field is absent, so no breakage).

Also read `server/api/auth/session.get.ts`. If `created_at` is NOT already returned in the response object, add it:

```ts
created_at: (user as any).created_at ?? (token as any)?.created_at ?? null,
```

(The session GET endpoint may already include the DB user's fields — check before modifying.)

- [ ] **Step 2: Write the new `profile/edit.vue`**

Replace `app/pages/profile/edit.vue` entirely:

```vue
<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiCardHeader from '~/components/ui/CardHeader.vue'
import UiInput from '~/components/ui/Input.vue'
import UiLabel from '~/components/ui/Label.vue'

definePageMeta({ middleware: 'auth' })

const { session, fetchSession } = useCurrentUser()
const { t } = useI18n()

useHead(() => ({ title: t('profile.edit.title') }))

const name = ref('')
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const provider = computed(() => (session.value.user as any)?.provider ?? 'credentials')
const isCredentials = computed(() => provider.value === 'credentials')

const joinedAt = computed(() => {
  const raw = (session.value.user as any)?.created_at
  if (!raw) return ''
  return new Date(raw).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
})

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

function onAvatarClick() {
  document.getElementById('avatar-input')?.click()
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
      await $fetch('/api/user/avatar', { method: 'POST', body: formData, credentials: 'include' })
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
      await $fetch('/api/user/profile', { method: 'PATCH', body, credentials: 'include' })
    }

    await fetchSession()
    toast.success(t('profile.edit.success'))
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: any) {
    const msg: string = e?.data?.message ?? e?.message ?? ''
    if (msg.includes('Current password is incorrect')) {
      toast.error(t('profile.edit.passwordWrong'))
    } else if (msg) {
      toast.error(msg)
    } else {
      toast.error(t('common.error'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container max-w-2xl py-8 px-4">
    <UiCard>
      <UiCardHeader>
        <h1 class="text-2xl font-bold font-heading">{{ t('profile.edit.title') }}</h1>
      </UiCardHeader>
      <UiCardContent>
        <form class="flex flex-col sm:flex-row gap-6" @submit.prevent="onSubmit">

          <!-- LEFT: avatar + account info -->
          <div class="flex flex-col gap-4 sm:w-48 shrink-0">

            <!-- Avatar -->
            <div class="flex flex-col items-center gap-3 rounded-lg border bg-card p-4">
              <button
                type="button"
                class="relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-muted hover:ring-2 hover:ring-primary/50 transition"
                :aria-label="t('profile.edit.avatar')"
                @click="onAvatarClick"
              >
                <img v-if="avatarPreview" :src="avatarPreview" alt="" class="size-full object-cover" />
                <VIcon v-else name="bi-person-circle" class="size-12 text-muted-foreground" />
                <span class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition text-white text-xs font-medium">
                  {{ t('profile.edit.avatar') }}
                </span>
              </button>
              <input id="avatar-input" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onAvatarChange" />
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
              <UiLabel for="name">{{ t('profile.edit.name') }}</UiLabel>
              <UiInput id="name" v-model="name" type="text" />
            </div>

            <template v-if="isCredentials">
              <div class="border-t pt-6 space-y-4">
                <p class="text-sm font-semibold">{{ t('profile.edit.passwordSection') }}</p>
                <div class="space-y-2">
                  <UiLabel for="current-password">{{ t('profile.edit.currentPassword') }}</UiLabel>
                  <UiInput id="current-password" v-model="currentPassword" type="password" autocomplete="current-password" />
                </div>
                <div class="space-y-2">
                  <UiLabel for="new-password">{{ t('profile.edit.newPassword') }}</UiLabel>
                  <UiInput id="new-password" v-model="newPassword" type="password" autocomplete="new-password" />
                </div>
                <div class="space-y-2">
                  <UiLabel for="confirm-password">{{ t('profile.edit.confirmPassword') }}</UiLabel>
                  <UiInput id="confirm-password" v-model="confirmPassword" type="password" autocomplete="new-password" />
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
  </div>
</template>
```

- [ ] **Step 3: Verify in browser**

1. Log in, go to `/profile/edit`
2. Left column: avatar circle (click to upload), email, login method, joined date (if `created_at` is in session)
3. Right column: name input, password section (credentials users) OR name input only (Google users)
4. Update name → Save → "Profile updated" toast → header name updates
5. Upload avatar → Save → header avatar updates
6. Wrong current password → "Current password is incorrect" toast
7. Mismatched new/confirm passwords → client-side toast before submission
8. New password < 8 chars → client-side toast before submission

- [ ] **Step 4: Commit**

```bash
# Stage profile page and auth changes — only add session.get.ts if it was modified in Step 1
git add app/pages/profile/edit.vue server/utils/authOptions.ts
# If session.get.ts was modified: git add server/api/auth/session.get.ts
git commit -m "feat: redesign edit profile page with two-column layout and password change"
```

---

**Plan 1 complete. Continue with `2026-03-11-admin-panel.md` for the Admin Panel implementation.**
