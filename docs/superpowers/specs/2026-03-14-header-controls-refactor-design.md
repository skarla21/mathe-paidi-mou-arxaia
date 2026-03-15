# Header Controls Refactor — Design Spec

**Date:** 2026-03-14
**Status:** Approved

---

## Overview

Refactor the two utility controls in the site header (language switcher and theme toggle) into focused, self-contained components with improved UX. Both the desktop header and the mobile drawer footer use the same `<LayoutThemeLanguageControls />` wrapper, so both get the new design automatically.

---

## Component Structure

Three files change, two are new:

```
app/components/layout/
  ThemeLanguageControls.vue   ← thin row wrapper only; delegates to sub-components
  LangToggle.vue              ← NEW
  ThemeToggle.vue             ← NEW
```

### `ThemeLanguageControls.vue`

Becomes a stateless row wrapper:

```html
<div class="flex items-center gap-2">
  <LayoutLangToggle />
  <LayoutThemeToggle />
</div>
```

No logic, no composables — purely structural. The existing `<script setup>` block must be removed entirely.

---

## `LangToggle.vue`

### Behaviour

- Renders a trigger button showing only the **current language flag** and a small dropdown chevron (▾).
- Clicking the trigger opens a `UiPopoverContent` below it.
- The popover contains **two flag buttons side-by-side**.
- The **selected flag** has a `ring-2 ring-primary` border.
- The **inactive flag** is dimmed (`opacity-50 hover:opacity-80`).
- Clicking a flag calls `setLocale(code)` and sets the local `open` ref to `false` — Radix Popover does not auto-close on arbitrary child clicks, so `v-model:open` must be used.

### Implementation notes

- Uses existing `UiPopover`, `UiPopoverTrigger`, `UiPopoverContent` from `app/components/ui/popover/`.
- `UiPopoverContent` props: `align="end"`, `:side-offset="6"` (`side` defaults to `"bottom"` — do not pass it explicitly as the wrapper does not forward it).
- `UiPopoverTrigger` must use `as-child` prop to avoid a `<button>` inside `<button>` nesting issue.
- Local state: `const open = ref(false)` — bound to the root via `<UiPopover v-model:open="open">` (the root, not the content or trigger).
- `useI18n()` provides `locale` and `setLocale`. Click handler per flag: `setLocale(code); open.value = false`.
- Trigger styling: `rounded-lg bg-muted px-2 py-1.5 flex items-center gap-1` — consistent pill with `ThemeToggle`.
- Flag buttons: `rounded-md` with `size-8` hit area; flag emoji at `text-xl`.
- Aria-labels: use `t('header.languageEl')` / `t('header.languageEn')` (not `nav.languageEl` / `nav.languageEn` — both key groups exist in the locale files).
- i18n keys confirmed present in both locales: `header.languageEl`, `header.languageEn`.

### Visual spec

```
[ 🇬🇷 ▾ ]   ← trigger (current locale = el)

opens ↓

┌─────────────────┐
│  [🇬🇷]  [🇬🇧]   │  ← 🇬🇷 has ring-2 ring-primary, 🇬🇧 is dimmed
└─────────────────┘
```

---

## `ThemeToggle.vue`

### Behaviour

- A `<button>` that calls `toggle()` on click.
- Contains a sliding track + thumb toggle.
- The thumb holds the mode icon — **☀️ in light, 🌙 in dark**.
- No external flanking icons (the previous sun/moon outside the track are removed).

### Implementation notes

- Track: `h-4 w-7 rounded-full transition-colors` — `bg-border` in light, `bg-primary` in dark.
- Thumb: `absolute h-3 w-3 rounded-full bg-background shadow-sm transition-transform flex items-center justify-center` — `translate-x-0.5` (light), `translate-x-3.5` (dark).
- Icon inside thumb: `VIcon` at `size-2.5` — `bi-sun-fill text-amber-500` when light, `bi-moon-fill text-blue-400` when dark.
- Wrapper button: `rounded-lg bg-muted px-2 py-1.5 flex items-center transition-colors hover:bg-muted/80`.
- State: `useTheme()` provides `colorMode` (readonly) and `toggle()`.
- `aria-label` on the wrapper `<button>`: `:aria-label="t('header.toggleTheme')"`.
- SSR safety: `useTheme()` uses Nuxt's `useState` with a `"light"` default — `colorMode` is always defined on both server and client. No `ClientOnly` wrapper needed (consistent with existing behaviour).

### Visual spec

```
Light mode:   [ ☀️ ·· ]   track = bg-border,   thumb left  (translate-x-0.5)
Dark mode:    [ ·· 🌙 ]   track = bg-primary,  thumb right (translate-x-3.5)
```

---

## What Does NOT Change

- `useTheme()` composable — no changes.
- `useI18n()` composable — no changes.
- `AppHeader.vue` — no changes (still uses `<LayoutThemeLanguageControls />`).
- Translation keys — no additions needed.
- Mobile drawer — picks up new design automatically via the same component.

---

## Files Modified / Created

| File | Action |
|---|---|
| `app/components/layout/ThemeLanguageControls.vue` | Modify — remove old markup, compose sub-components |
| `app/components/layout/LangToggle.vue` | Create |
| `app/components/layout/ThemeToggle.vue` | Create |
