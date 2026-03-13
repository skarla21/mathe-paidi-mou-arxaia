# Future Tasks

Remaining work after the 2026-03-12 frontend audit pass.

---

## High Priority

### Type remaining `ref<any>()` in admin pages

The audit's C2 fix covered `course/[courseId].vue`, `lesson/[lessonId].vue`, `grade/[grade].vue`, and `admin/purchases.vue`. These admin pages still use untyped refs — use the interfaces from `types/domain.ts` as the base:

- `app/pages/admin/categories.vue` — lines 20–23
- `app/pages/admin/courses.vue` — lines 21–24
- `app/pages/admin/grades.vue` — lines 20–23
- `app/pages/admin/index.vue` — line 10
- `app/pages/admin/users.vue`
- `app/pages/grade/[grade]/[subject].vue` — line 12

---

## Medium Priority

### Self-host Google Fonts (L2)

`nuxt.config.ts` currently loads Comfortaa, Source Serif Pro, Noto Serif, and Titan One from `fonts.googleapis.com` at runtime. `preconnect` hints were added (L3 ✅) but fonts still hit Google's CDN on every first visit — privacy concern + CDN dependency.

Options:
- Install `nuxt-fonts` module (auto-downloads and self-hosts)
- Or download `.woff2` files manually into `public/fonts/` and update `app/assets/css/main.css` `@font-face` declarations

### AppFooter misleading links

`app/components/layout/AppFooter.vue` has footer links labelled `footer.privacy` and `footer.terms` pointing to `/about` and `/#communication` respectively. Either:
- Create actual `/privacy` and `/terms` pages
- Or remove the section entirely until legal pages exist

---

## Low Priority

### Accept-Language SSR locale detection

`useI18n.ts` now uses `useCookie` (L9 ✅) so returning users with a saved preference get the correct locale on SSR. But first-time visitors (no cookie) always get Greek.

Add server-side `Accept-Language` header detection as a fallback for users without a cookie — read `useRequestHeaders(['accept-language'])` in a Nuxt plugin or middleware and set the locale cookie before the first render.

### `useHead` titles still hardcoded in some admin pages

Several admin pages call `useHead` with static strings or without reactive `t()` wrappers. Audit all `app/pages/admin/*.vue` for `useHead` and ensure titles use `() => ({ title: t('...') })` reactive getters.
