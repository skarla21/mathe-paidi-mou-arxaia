# mathe-paidi-mou-arxaia — CLAUDE.md

Greek educational platform (Ancient Greek exam prep). Nuxt 4 + Vue 3 + TypeScript.
Deploy target: Vercel. Source dir: `app/` (NOT `src/`).

---

## Skills + Agents — Always Use Both

**On every prompt**, before taking action:

1. **Check for relevant skills/plugins first** — if a skill applies (e.g. `frontend-design` for UI work, `brainstorming` for new features, `test-driven-development` for implementations), invoke it via the `Skill` tool. For this project, ignore skills/plugins from third-party marketplaces.
2. **Then dispatch the appropriate agent** (e.g. `frontend-developer`, `codebase-navigator`) — pass any guidance from the skill into the agent's prompt.

Skills provide **design principles, workflows, and quality standards**. Agents provide **hands-on execution with project-specific tools**. They complement each other — never skip one in favor of the other.

**Examples:**

- Frontend task → invoke `frontend-design` skill → then dispatch `frontend-developer` agent with the design guidance
- New feature → invoke `brainstorming` skill → then plan/implement using the relevant agent
- Bug fix → invoke `systematic-debugging` skill → then use `codebase-navigator` agent to trace the issue
- Documentation lookup → dispatch `docs-explorer` agent directly (no skill needed)

**Rule: If both a skill and an agent are relevant, use both. Skills inform the approach; agents do the work.**

---

## Tech Stack

| Layer         | Choice                                                     |
| ------------- | ---------------------------------------------------------- |
| Framework     | Nuxt 4.3.1, Vue 3, `<script setup lang="ts">`              |
| Styling       | Tailwind CSS v4 (Vite plugin, NO tailwind.config.js)       |
| UI components | shadcn-vue (Radix Vue) — all in `app/components/ui/`       |
| Animations    | GSAP 3 + ScrollTrigger via `useGsapReveal()` composable    |
| Auth          | `@auth/core` JWT sessions — Credentials + Google           |
| Database      | Supabase (PostgreSQL) with RLS                             |
| Storage       | Supabase Storage (PDF uploads)                             |
| Payments      | Stripe (checkout + webhook)                                |
| PDF rendering | pdfjs-dist (dynamic import, client-only)                   |
| Icons         | oh-vue-icons, Bootstrap icon set — `<VIcon name="bi-*" />` |
| Toasts        | vue-sonner — `toast.*()`                                   |
| Email         | Resend (contact form, verification, password reset)        |
| i18n          | Custom `useI18n()` composable — NOT Nuxt i18n module       |
| Theme         | Custom `useTheme()` composable — class on `<html>`         |

---

## Directory Tree

```
app/
  pages/         # index, about, login, register, profile, profile/edit,
                 # dashboard, grade/[grade], grade/[grade]/[subject],
                 # course/[courseId], lesson/[lessonId], admin/*
  components/
    layout/      # AppHeader.vue, AppFooter.vue, NotesDropdown.vue
    search/      # GlobalSearch.vue
    lesson/      # PdfViewer.vue
    ui/          # shadcn components (Button, Card, Input, …)
  composables/   # useCurrentUser, useI18n, useTheme, useGsapReveal
  layouts/       # default.vue, admin.vue
  middleware/    # auth.ts, admin.ts, guest-only.ts
  locales/       # en.json, el.json  ← client-side translations
  plugins/       # oh-vue-icons.ts
  lib/           # utils.ts (cn = clsx + tailwind-merge)
  assets/css/    # main.css (Tailwind @theme vars + custom utilities)
server/
  api/           # auth/, courses/, lessons/, grades.get, subjects.get,
                 # search.get, signout.post, stripe/, admin/, user/
  middleware/    # auth.context.ts  ← sets event.context.auth every request
  utils/         # supabaseServer, authOptions, requireAuth, requireAdmin, access
supabase/        # schema.sql
types/           # auth.d.ts (Session augment: id + isAdmin), nitro.d.ts (H3EventContext)
public/locales/  # en.json, el.json (server-side copies)
```

---

## Dev Commands

```bash
pnpm dev           # start dev server at http://localhost:3000
pnpm build         # production build
pnpm preview       # preview production build
pnpm check         # typecheck + eslint fix (run after every new feature)
```

Env vars: copy `.env.example`. Prefix `NUXT_PUBLIC_` for client-exposed, `NUXT_` for server-only.

---

## CRITICAL — Git / Remote Rules

- **NEVER push to the remote repository** — commits are local-only. Do NOT run `git push`, `git push --force`, or any command that publishes to a remote.
- **After every new feature**, run `pnpm check` (typecheck + ESLint fix) before committing.

---

## Critical Rules — DO / DON'T

### i18n

- **DO** `const { t } = useI18n()` — use `t('key')` for every user-visible string
- **DO** add new keys to BOTH `app/locales/en.json` AND `app/locales/el.json`
- **DON'T** hardcode any string in templates or script setup
- **DON'T** use Nuxt i18n module — the project has a custom composable

### Notifications

- **DO** `import { toast } from 'vue-sonner'` → `toast.success(t('...'))`, `toast.error(t('...'))`
- **DON'T** use `alert()`, `confirm()`, or `window.prompt()` — ever

### Tailwind / CSS

- **DO** configure theme tokens in `app/assets/css/main.css` under `@theme inline { … }`
- **DON'T** create or modify `tailwind.config.js` — Tailwind v4 uses CSS-only config
- **DO** use semantic tokens: `text-foreground`, `bg-card`, `text-primary`, `text-muted-foreground`

### Components

- **DO** use existing `app/components/ui/` components (Button, Card, Input, …)
- **DON'T** install new UI libraries — extend shadcn components in `ui/` instead
- **DO** register new icons in `app/plugins/oh-vue-icons.ts`, use `<VIcon name="bi-*" />`

### Client/Server Guards

- **DO** use `import.meta.client` for client-only code
- **DON'T** use `process.client` — deprecated preference in this codebase
- **DO** guard GSAP, localStorage, and DOM access with `import.meta.client`

### Auth — Client

- **DO** `const { session, isAdmin, isStudent } = useCurrentUser()` in components
- **DO** `definePageMeta({ middleware: 'auth' })` for protected pages
- **DO** `definePageMeta({ middleware: 'admin' })` for admin pages

### Auth — Server

- **DO** call `requireAuth(event)` to get `userId` (throws 401 if unauthenticated)
- **DO** call `requireAdmin(event)` at the TOP of every `/api/admin/*` handler (throws 403)
- **DO** read user from `event.context.auth.userId` (set by `server/middleware/auth.context.ts`)
- **DON'T** read cookies or re-validate sessions manually in route handlers

### Database

- **DO** use `serverSupabaseService()` for admin/server ops that need to bypass RLS
- **DO** use `serverSupabaseAnon()` for public/user-scoped reads (RLS enforced)
- **DO** use `canAccessCourse(userId, courseId)` / `canAccessLesson(userId, lessonId)` from `server/utils/access.ts`
- **DON'T** expose `supabaseServiceKey` in any `public:` runtimeConfig key

---

## Auth Patterns

### Client-side session

```ts
const { session, isAdmin } = useCurrentUser();
// session.value.user?.id  — string UUID
// session.value.user?.isAdmin  — boolean
```

### Server route — require login

```ts
import { requireAuth } from "~/server/utils/requireAuth";
const userId = requireAuth(event); // throws 401 if missing
```

### Server route — require admin

```ts
import { requireAdmin } from "~/server/utils/requireAdmin";
requireAdmin(event); // throws 403 if not admin
```

### Server context (set by middleware)

```ts
event.context.auth; // { userId: string | null, isAdmin: boolean }
```

---

## Database Patterns

Tables: `users`, `grades`, `subjects`, `courses`, `lessons`, `purchases`

- `users."isAdmin"` — quoted camelCase column
- `courses.is_free`, `lessons.is_free` — gate paid content
- `purchases(user_id, course_id)` — owns a course after Stripe checkout

```ts
const supabase = serverSupabaseService(); // admin/server — bypasses RLS
const supabase = serverSupabaseAnon(); // public reads — respects RLS
```

---

## Fonts

- Headings: `class="font-heading"` → Comfortaa
- Body: Source Serif Pro, Noto Serif (default)
- Accent: `class="font-display"` → Titan One
