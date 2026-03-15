# Edit Profile Modal — Design Spec

**Date:** 2026-03-14
**Status:** Approved

---

## Context

The Edit Profile page (`/profile/edit`) currently exists as a separate route. The user wants it moved to a modal dialog — accessible only via the authenticated user dropdown (and mobile drawer), not as a navigable URL. Two bugs also need fixing:

1. **Avatar placeholder** — `bi-person-circle` icon shows a visual artifact (double border rings) when rendered at `size-12` inside a `size-20 rounded-full overflow-hidden` container.
2. **401 on profile save** — `PATCH /api/user/profile` always returns 401. Root cause: `server/middleware/auth.context.ts` passes all of `event.node.req.headers` to `new Request()` using an unsafe cast (`as unknown as HeadersInit`). `IncomingHttpHeaders` can have `string | string[] | undefined` values; the `Headers` constructor may silently drop or mangle the `cookie` header in some cases. Fix: extract only the `cookie` header explicitly using `getRequestHeader(event, 'cookie')`.

---

## Architecture

### New files

| File | Purpose |
|------|---------|
| `app/composables/useEditProfileModal.ts` | Global open/close state — mirrors `useAuthModal` pattern |
| `app/components/EditProfileModal.vue` | Modal wrapping the edit form (root-level → auto-imports as `<EditProfileModal />`) |

### Modified files

| File | Change |
|------|--------|
| `app/layouts/default.vue` | Add `<EditProfileModal />` (auto-imported) |
| `app/layouts/admin.vue` | Add `<EditProfileModal />` (admins can also edit their profile) |
| `app/components/layout/AppHeader.vue` | Replace two `/profile/edit` NuxtLinks with buttons that call `open()` |
| `server/middleware/auth.context.ts` | Fix cookie extraction (targeted `getRequestHeader` instead of full headers cast) |

### Deleted files

| File | Reason |
|------|--------|
| `app/pages/profile/edit.vue` | Modal fully replaces it; route no longer needed |

---

## Component Design

### `useEditProfileModal.ts`

```ts
export function useEditProfileModal() {
  const isOpen = useState<boolean>('editProfileModal.open', () => false)
  const open = () => { isOpen.value = true }
  const close = () => { isOpen.value = false }
  return { isOpen, open, close }
}
```

### `EditProfileModal.vue`

Structure:
```
UiDialog (:open="isOpen" @update:open="(v) => !v && close()")
  UiDialogPortal
    UiDialogOverlay
    UiDialogContent (class="max-w-2xl sm:max-h-[90vh] overflow-y-auto")
      UiDialogHeader
        UiDialogTitle  ← profile.edit.title
        UiDialogClose  ← X button
      <form> ← identical to edit.vue form body
        LEFT col: avatar + account info
        RIGHT col: name + password fields + save button
```

The `:open` / `@update:open` pattern (not `v-model:open`) mirrors `AuthModal.vue` — the `close()` function resets composable state cleanly.

**Avatar placeholder (option B — approved):**
```html
<!-- replaces <VIcon name="bi-person-circle"> in the avatar upload button -->
<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="8" r="4" fill="currentColor" class="text-muted-foreground"/>
  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" class="text-muted-foreground"/>
</svg>
```
Container: `rounded-full bg-muted border-2 border-border` (adds an explicit gray border, removing the visual artifact caused by the icon's own outline ring meeting the container's `rounded-full` clip).

AppHeader uses `bi-person-circle` only in two non-avatar contexts (SSR fallback button, guest login mobile button) — those are not the same double-ring context and are **not** changed.

**Blob URL cleanup:**
Watch `isOpen` going `false` to revoke any pending blob URL. The modal is mounted in the layout permanently and never unmounts, so `onUnmounted` is NOT used.

### `auth.context.ts` fix

Replace:
```ts
headers: (event.node.req.headers as unknown) as HeadersInit,
```
With:
```ts
headers: {
  cookie: getRequestHeader(event, 'cookie') ?? '',
},
```

This targets only what Auth() needs to validate the session (the cookie) and avoids type-unsafe casts.

---

## Data Flow

1. User clicks "Edit Profile" in dropdown / mobile drawer → `useEditProfileModal().open()`
2. Modal opens, watcher populates form from `session.value.user`
3. On submit → `$fetch PATCH /api/user/profile` + `$fetch POST /api/user/avatar`
4. Server reads session cookie correctly (after auth.context.ts fix) → updates DB
5. `fetchSession()` refreshes the global session state → modal shows updated name/avatar
6. On success → `toast.success(...)`, form resets, modal stays open (user can close via X or Escape)

---

## i18n

**One new key** needed: `common.close` (for `UiDialogClose` aria-label).
- `en.json`: `"close": "Close"`
- `el.json`: `"close": "Κλείσιμο"`

All other keys (`profile.edit.*`) already exist in both locale files.

## Security / Auth Protection

The "Edit Profile" button is inside `v-if="session.user"` in AppHeader — it is never rendered to unauthenticated users. The API endpoint (`/api/user/profile`) still calls `requireAuth(event)` server-side. Protection is layered: UI-level (button hidden) + API-level (server auth guard).

---

## Notes

- `/profile/edit` URL will 404 after deletion — this is acceptable since the link was only ever exposed via the authenticated dropdown (never public-facing or linkable). No redirect needed.

---

## Verification

1. Open dev server (`npm run dev`)
2. Log in → click avatar in navbar → "Edit Profile" opens modal (not new page)
3. `/profile/edit` URL returns 404 (expected)
4. Change name → save → success toast, header avatar name updates
5. Change password (credentials user) → save → success toast
6. Wrong current password → error toast
7. Google-login user → password section hidden
8. Mobile: hamburger → "Edit Profile" → modal opens, drawer closes
9. Avatar upload → preview updates, save persists
10. Default avatar shows clean silhouette with gray border (no double-ring artifact)
11. `npm run check` passes
