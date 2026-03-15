# Header Controls Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the header language and theme toggles with a flag+chevron popover for language and an icon-in-thumb track toggle for theme, split into two focused sub-components.

**Architecture:** `ThemeLanguageControls.vue` becomes a stateless row wrapper composing two new components — `LangToggle.vue` (flag trigger + Radix Popover with 2 flags, `v-model:open` managed manually) and `ThemeToggle.vue` (pill button with sliding track and mode icon inside the thumb). Both the desktop header and mobile drawer automatically get the new designs via the shared wrapper.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Tailwind v4 semantic tokens, shadcn-vue `UiPopover` / `UiPopoverTrigger` / `UiPopoverContent`, oh-vue-icons `<VIcon>`, custom `useTheme()` + `useI18n()` composables.

---

## Chunk 1: ThemeToggle + update ThemeLanguageControls

### Task 1: Create `ThemeToggle.vue`

**Files:**
- Create: `app/components/layout/ThemeToggle.vue`

- [ ] **Step 1: Create the file with the following complete content**

```vue
<script setup lang="ts">
const { toggle, colorMode } = useTheme()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="rounded-lg bg-muted px-2 py-1.5 flex items-center transition-colors hover:bg-muted/80"
    :aria-label="t('header.toggleTheme')"
    @click="toggle"
  >
    <div
      class="relative h-4 w-7 rounded-full transition-colors"
      :class="colorMode === 'dark' ? 'bg-primary' : 'bg-border'"
    >
      <span
        class="absolute top-0.5 h-3 w-3 rounded-full bg-background shadow-sm transition-transform flex items-center justify-center"
        :class="colorMode === 'dark' ? 'translate-x-3.5' : 'translate-x-0.5'"
      >
        <VIcon
          v-if="colorMode === 'dark'"
          name="bi-moon-fill"
          class="size-2.5 text-blue-400"
          aria-hidden="true"
        />
        <VIcon
          v-else
          name="bi-sun-fill"
          class="size-2.5 text-amber-500"
          aria-hidden="true"
        />
      </span>
    </div>
  </button>
</template>
```

Design notes:
- Track `bg-border` (light) → `bg-primary` (dark). Same logic as existing component.
- Thumb `translate-x-0.5` (light, left) → `translate-x-3.5` (dark, right). Track is `w-7` (28px); thumb is `w-3` (12px); at `translate-x-3.5` (14px) + 12px thumb = 26px < 28px — no overflow.
- `flex items-center justify-center` on the thumb span centers the icon inside.
- `text-amber-500` / `text-blue-400` are the project's established convention for sun/moon (intentional, per existing `ThemeLanguageControls.vue`).
- `bi-sun-fill` and `bi-moon-fill` are already registered in `app/plugins/oh-vue-icons.ts`.

- [ ] **Step 2: Run typecheck + lint**

```bash
npm run check
```

Expected: no errors related to `ThemeToggle.vue`. (Other pre-existing warnings are acceptable.)

- [ ] **Step 3: Commit**

```bash
git add app/components/layout/ThemeToggle.vue
git commit -m "feat: add ThemeToggle with icon-in-thumb design"
```

---

### Task 2: Update `ThemeLanguageControls.vue` to use the new sub-components

**Files:**
- Modify: `app/components/layout/ThemeLanguageControls.vue`

Current file is ~47 lines with a full `<script setup>` block managing theme and language state. It will be replaced with a pure structural wrapper.

- [ ] **Step 1: Replace the entire file content**

```vue
<template>
  <div class="flex items-center gap-2">
    <LayoutLangToggle />
    <LayoutThemeToggle />
  </div>
</template>
```

Notes:
- `LayoutLangToggle` and `LayoutThemeToggle` are the Nuxt auto-import prefixes for `app/components/layout/LangToggle.vue` and `app/components/layout/ThemeToggle.vue`.
- No `<script setup>` block — this component has zero logic.
- `LangToggle.vue` does not exist yet; Nuxt will warn at runtime but not fail the typecheck. It is created in Chunk 2.

- [ ] **Step 2: Run typecheck + lint**

```bash
npm run check
```

Expected: possible "component not registered" warning for `LayoutLangToggle` — this is expected until Chunk 2 is complete. No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/layout/ThemeLanguageControls.vue
git commit -m "refactor: simplify ThemeLanguageControls to stateless row wrapper"
```

---

## Chunk 2: LangToggle

### Task 3: Create `LangToggle.vue`

**Files:**
- Create: `app/components/layout/LangToggle.vue`

- [ ] **Step 0: Confirm i18n keys exist in both locale files**

Open `app/locales/en.json` and `app/locales/el.json` and verify the `"header"` section contains `"languageEl"` and `"languageEn"` keys. They are confirmed present as of plan writing:

```json
// en.json — app/locales/en.json lines 292-295
"header": {
  "languageEl": "Switch to Greek",
  "languageEn": "Switch to English",
  "toggleTheme": "Toggle theme"
}
```

If for any reason they are missing, add them to both files before proceeding.

- [ ] **Step 1: Create the file with the following complete content**

```vue
<script setup lang="ts">
const { t, locale, setLocale } = useI18n()

const open = ref(false)

const langs = [
  { code: 'el' as const, flag: '🇬🇷', ariaKey: 'header.languageEl' },
  { code: 'en' as const, flag: '🇬🇧', ariaKey: 'header.languageEn' },
]

function select(code: 'el' | 'en') {
  setLocale(code)
  open.value = false
}
</script>

<template>
  <UiPopover v-model:open="open">
    <UiPopoverTrigger as-child>
      <button
        type="button"
        class="rounded-lg bg-muted px-2 py-1.5 flex items-center gap-1 transition-colors hover:bg-muted/80"
        :aria-label="locale === 'el' ? t('header.languageEl') : t('header.languageEn')"
      >
        <span class="text-base leading-none" aria-hidden="true">{{ locale === 'el' ? '🇬🇷' : '🇬🇧' }}</span>
        <VIcon name="bi-chevron-down" class="size-2.5 text-muted-foreground" aria-hidden="true" />
      </button>
    </UiPopoverTrigger>
    <UiPopoverContent align="end" :side-offset="6" class="w-auto p-2">
      <div class="flex gap-2">
        <button
          v-for="lang in langs"
          :key="lang.code"
          type="button"
          class="flex size-8 items-center justify-center rounded-md text-xl transition-opacity"
          :class="locale === lang.code ? 'ring-2 ring-primary' : 'opacity-50 hover:opacity-80'"
          :aria-label="t(lang.ariaKey)"
          @click="select(lang.code)"
        >
          {{ lang.flag }}
        </button>
      </div>
    </UiPopoverContent>
  </UiPopover>
</template>
```

Implementation notes:
- `UiPopover` (`app/components/ui/popover/Popover.vue`) uses `defineProps<{ open?: boolean }>` + `defineEmits<{ 'update:open': [boolean] }>` — `v-model:open` works correctly.
- `UiPopoverTrigger` has `asChild?: boolean` prop — `as-child` avoids wrapping the trigger `<button>` inside Radix's own `<button>`, preventing invalid nested button HTML.
- `UiPopoverContent` does **not** forward a `side` prop (not in its `Props` interface) — omit it; Radix defaults to `"bottom"`. Pass `align="end"` explicitly (wrapper default is `"start"`).
- `class="w-auto p-2"` overrides the wrapper's `min-w-32 p-1` defaults to keep the popover compact.
- `locale` is `Readonly<Ref<'el' | 'en'>>` from `useI18n()` — read-only, never assign directly.
- `setLocale(code)` sets the Nuxt `useState` + cookie; triggers reactivity so the trigger flag updates immediately.
- `header.languageEl` / `header.languageEn` keys confirmed in both `app/locales/en.json` and `app/locales/el.json` under the `"header"` namespace (not `"nav"`).
- `bi-chevron-down` is already registered in `app/plugins/oh-vue-icons.ts`.

- [ ] **Step 2: Run typecheck + lint**

```bash
npm run check
```

Expected: no errors. All types resolve — `locale` is `'el' | 'en'`, `setLocale` accepts `'el' | 'en'`, `as const` on lang codes ensures the literal types flow through.

- [ ] **Step 3: Visual verification**

Start the dev server and check both placements:

```bash
npm run dev
```

Open http://localhost:3000 and verify:

**Desktop header (top-right controls):**
1. Language trigger shows current flag + chevron `▾`
2. Clicking opens a small popover below with 🇬🇷 and 🇬🇧 side-by-side
3. Active language has a blue ring border; inactive is dimmed
4. Clicking a flag switches the language and closes the popover

**Mobile drawer (open hamburger menu, scroll to footer):**
5. Same language control appears in the drawer footer — verify it behaves identically

- [ ] **Step 4: Commit**

```bash
git add app/components/layout/LangToggle.vue
git commit -m "feat: add LangToggle with flag popover design"
```
