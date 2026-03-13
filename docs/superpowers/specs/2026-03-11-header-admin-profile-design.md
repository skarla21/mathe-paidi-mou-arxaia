# Design Spec: Header, Admin Panel & Edit Profile

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Three interconnected areas — AppHeader avatar/controls, Edit Profile page redesign, Admin Panel full CRUD + stats.

---

## 1. Header — Right Side Controls

### Layout
The right side of `AppHeader` always shows the same three controls, regardless of auth state (the existing standalone Login button is removed):

```
[Search] [🇬🇷 🇬🇧] [☀️ ─── 🌙] [Avatar]
```

### Language Flags
- Two flag emojis (🇬🇷 and 🇬🇧) displayed side by side in a pill/chip container.
- The active locale has a visible indicator (underline or highlighted border).
- Greek is the default locale.
- Clicking a flag calls `setLocale('el')` / `setLocale('en')` from `useI18n()`.
- Replace the current text-based language switcher in the dropdown entirely.

### Theme Toggle
- Inline sun/moon toggle (icon + pill toggle switch) in the header, always visible.
- Removes the standalone ghost icon button that currently exists in the header.
- Calls `toggle()` from `useTheme()`.

### Avatar Button
- Always a circular button (size 9, `rounded-full`).
- Shows `session.user.avatar_url` if present, otherwise a `bi-person-circle` icon.
- Opens a dropdown on click.
- No separate Login button in the header — the avatar button is the single entry point for auth actions.

---

## 2. Avatar Dropdown — Authenticated

```
┌────────────────────────────┐
│ [Avatar] Name              │
│          email@example.com │
├────────────────────────────┤
│ ✏️  Edit Profile            │
│ 📚  My Courses              │
├────────────────────────────┤
│ ⚙️  Admin Panel (admin only)│
├────────────────────────────┤
│ 🚪  Logout                  │
└────────────────────────────┘
```

- **User info header**: non-interactive, shows avatar thumbnail + name + email. **Note:** `session.user` currently does not include `email` — the session type and `/api/auth/session` response must be extended to include it as part of this work.
- **Edit Profile**: navigates to `/profile/edit`.
- **My Courses**: navigates to `/dashboard` (student's purchased course list).
- **Admin Panel**: only rendered when `isAdmin === true`; navigates to `/admin`.
- **Logout**: opens the existing confirmation `AlertDialog` (already implemented in `app/components/layout/AppHeader.vue` — reuse as-is), then calls `POST /api/signout` and navigates to `/`.
- Dividers between logical groups.

---

## 3. Avatar Dropdown — Unauthenticated

```
┌──────────────┐
│ 👤  Login     │
│ 📝  Register  │
└──────────────┘
```

- Only Login and Register — no language/theme (those are always in the header).
- Login → `/login`, Register → `/register`.

---

## 4. Edit Profile Page (`/profile/edit`) — Full Redesign

### Layout: Two Columns

**Left column (narrower):**
1. **Avatar card** — circular avatar preview (large), "Change photo" click-to-upload button, accepted formats note (JPEG/PNG/WEBP, max 2 MB). Uses a hidden `<input type="file">` triggered by clicking the avatar/button.
2. **Account info card** (read-only, shaded background):
   - Email address
   - Login provider: "Credentials" or "Google"
   - Member since date (formatted)

**Right column (wider):**
1. **Display name** — text input, pre-filled from session. Saved on form submit.
2. **Divider**
3. **Change password section** — only rendered when `provider === 'credentials'`. Hidden entirely for Google OAuth users. Fields:
   - Current password (required)
   - New password (required, min 8 chars)
   - Confirm new password (must match)

**Single "Save changes" button** at the bottom of the right column. Submits both name and password changes in one action (independent API calls, both fire if their fields changed).

### API

**`PATCH /api/user/profile`** — handles `{ name?, currentPassword?, newPassword? }`.
- If `name` is present: update `users.name`. Returns `{ id, email, name, avatar_url }` on success.
- If `currentPassword` + `newPassword` are present: verify `currentPassword` against `users.password_hash` using `bcrypt.compare`. On mismatch → `400 { message: 'Current password is incorrect' }`. On match → hash new password with bcrypt and update `users.password_hash`. Does NOT return the hash.
- Either field can be sent independently; both can be sent together.
- `401` if unauthenticated; `400` for missing/invalid body.

**`POST /api/user/avatar`** — multipart `FormData` with a `file` field.
- Validates type (JPEG/PNG/WEBP) and size (≤ 2 MB); returns `400` with message on failure.
- Uploads to Supabase Storage bucket `avatars` at path `{userId}/{timestamp}.{ext}`.
- Updates `users.avatar_url` with the public URL.
- Returns `{ avatar_url }` on success; `500` with message on Supabase error.

After either save: call `fetchSession()` on the client to refresh the session so the header avatar/name updates immediately. Show `toast.success(t('profile.edit.success'))` or `toast.error(message)` per outcome.

### Auth
- `definePageMeta({ middleware: 'auth' })` — redirect to `/login` if unauthenticated.
- Provider detection: read `users.provider` column (new field, see Schema section).

---

## 5. Admin Panel

### Sidebar Navigation

```
⚙️ Admin
─────────────
📊 Overview
─────────────
Content
  🎓 Grades
  📚 Subjects
  📖 Courses
  📄 Lessons
  🏷️ Categories
─────────────
People
  👥 Users
  🛒 Purchases
─────────────
← Back to site
```

- Removes the "Uploads" link (file management handled within lesson/course forms).
- Adds: Categories, Users.

### Overview Dashboard (`/admin`)

Four stat cards (top row):
| Stat | Source |
|---|---|
| Total Users | `count(*) from users` |
| Total Lessons | `count(*) from lessons` |
| Downloads | `count(*) from lesson_downloads` |
| Revenue | JOIN purchases with courses, `sum(courses.price)` where `is_free = false` — the `purchases` table has no `amount` column |

Two tables below (side by side):
- **Recent Downloads**: user name, lesson title, time ago — last 10 rows from `lesson_downloads` joined with users + lessons.
- **Top Lessons**: lesson title + total download count — top 10 by `count(*)` grouped by `lesson_id`.

### CRUD Pattern
All create/edit actions open a **modal dialog** (shadcn `Dialog`/`AlertDialog`). The list page stays visible underneath. Delete actions use a confirmation dialog. No separate pages for forms.

### Grades (`/admin/grades`)
- List: name, order number.
- Actions per row: Edit, Delete.
- Modal fields: name (text), order (number).
- Up/down arrow buttons per row to change `order` (no drag library needed — consistent with the rest of the admin CRUD pattern).

### Subjects (`/admin/subjects`)
- List: name, grade label.
- Filter/group by grade.
- Modal fields: name (text), grade (select from grades).

### Courses (`/admin/courses`)
- List: thumbnail, title, subject, free/paid badge.
- Modal fields: title (text), description (textarea), subject (select), is_free (toggle), price in € (shown only when `is_free = false`), thumbnail (file upload → `courses.thumbnail_url`).

### Lessons (`/admin/lessons`)
- List: title, assigned to (course name OR category name), free/paid badge, PDF indicator (✓/✗).
- Modal fields: title (text), content (textarea), is_free (toggle), PDF upload (`lessons.pdf_url`), order (number), assignment type (radio: "Part of a course" | "Standalone category"), then either course select or category select.

### Categories (`/admin/categories`) — NEW
- Simple list of lesson category names + order.
- Modal fields: name (text), order (number).
- Used as the grouping for standalone lessons not belonging to a course.
- Examples: Fairytales, Poems, Exercises.

### Users (`/admin/users`) — NEW
- Table: avatar, name, email, joined date, isAdmin (toggle switch), download count, purchase count.
- Clicking a user row opens a modal showing that user's purchases (course title, date) and recent downloads (lesson title, date).
- isAdmin toggle fires `PATCH /api/admin/users/[id]` to set `"isAdmin"`.

### Purchases (`/admin/purchases`)
- Table: user name, course title, date, Stripe session ID.
- "Grant access" button per row → calls `POST /api/admin/purchases/grant` with `{ userId, courseId }` to manually insert a purchase row.

---

## 6. Database Schema Changes

All changes are additive migrations (no destructive drops until data is migrated).

```sql
-- 1. Add provider to users (tracks auth method: 'credentials' | 'google')
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS provider text DEFAULT 'credentials';

-- 2. New: lesson_categories table
CREATE TABLE IF NOT EXISTS public.lesson_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  "order" int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS lesson_categories_order_idx ON public.lesson_categories("order");

-- 3. Lessons: add category_id FK + order column
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.lesson_categories(id) ON DELETE SET NULL;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS "order" int NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS lessons_category_id_idx ON public.lessons(category_id);
CREATE INDEX IF NOT EXISTS lessons_order_idx ON public.lessons("order");
-- NOTE: Migrate data from lessons.category (text) → lessons.category_id before dropping old column.
-- DROP COLUMN category is a separate step after migration.

-- 4. Courses: add thumbnail
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- 5. New: lesson_downloads table (stats tracking)
CREATE TABLE IF NOT EXISTS public.lesson_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_downloads_user_id_idx ON public.lesson_downloads(user_id);
CREATE INDEX IF NOT EXISTS lesson_downloads_lesson_id_idx ON public.lesson_downloads(lesson_id);
CREATE INDEX IF NOT EXISTS lesson_downloads_at_idx ON public.lesson_downloads(downloaded_at DESC);

-- 6. RLS policies for new tables
-- NOTE: All admin writes use serverSupabaseService() (service role key) which bypasses RLS.
-- Only public-read and user-scoped-read policies are needed for the anon key.
ALTER TABLE public.lesson_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_categories_select_all" ON public.lesson_categories FOR SELECT USING (true);

ALTER TABLE public.lesson_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_downloads_select_own" ON public.lesson_downloads FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE anon policies needed — writes go through service role in server routes.
```

**Constraint:** A lesson should belong to a course OR a category, not both. Enforce via a CHECK constraint or application-level validation:
```sql
ALTER TABLE public.lessons ADD CONSTRAINT lessons_assignment_check
  CHECK (
    (course_id IS NOT NULL AND category_id IS NULL) OR
    (course_id IS NULL AND category_id IS NOT NULL) OR
    (course_id IS NULL AND category_id IS NULL)  -- fully uncategorized (draft state)
  );
```

---

## 7. New API Endpoints Needed

| Method | Path | Purpose |
|---|---|---|
| `PATCH` | `/api/user/profile` | Update name + password (extend existing) |
| `POST` | `/api/user/avatar` | Upload profile photo (extend existing) |
| `GET` | `/api/admin/stats` | Overview dashboard data |
| `GET/POST/PATCH/DELETE` | `/api/admin/categories` + `/api/admin/categories/[id]` | Category CRUD |
| `GET/POST/PATCH/DELETE` | `/api/admin/lessons` + `/api/admin/lessons/[id]` | Lesson CRUD (extend existing) |
| `GET/POST/PATCH/DELETE` | `/api/admin/courses` + `/api/admin/courses/[id]` | Course CRUD (extend existing) |
| `GET/POST/PATCH/DELETE` | `/api/admin/grades` + `/api/admin/grades/[id]` | Grade CRUD (extend existing) |
| `GET/POST/PATCH/DELETE` | `/api/admin/subjects` + `/api/admin/subjects/[id]` | Subject CRUD (extend existing) |
| `GET` | `/api/admin/users` | User list |
| `PATCH` | `/api/admin/users/[id]` | Toggle isAdmin |
| `POST` | `/api/admin/purchases/grant` | Manually grant course access |

All `/api/admin/*` endpoints must call `requireAdmin(event)` at the top.

---

## 8. New Pages & Components

| Path | Type | Notes |
|---|---|---|
| `app/pages/admin/categories.vue` | Page | Category list + modal CRUD |
| `app/pages/admin/users.vue` | Page | User table + isAdmin toggle + user detail modal |
| `app/components/admin/CategoryModal.vue` | Component | Create/edit category dialog |
| `app/components/admin/CourseModal.vue` | Component | Create/edit course dialog |
| `app/components/admin/LessonModal.vue` | Component | Create/edit lesson dialog with PDF upload |
| `app/components/admin/GradeModal.vue` | Component | Create/edit grade dialog |
| `app/components/admin/SubjectModal.vue` | Component | Create/edit subject dialog |
| `app/components/admin/UserDetailModal.vue` | Component | Shows user's purchases + download history |

---

## 9. i18n Keys Needed

All new UI strings must be added to both `app/locales/en.json` and `app/locales/el.json`. Key areas:

**Header (check existing keys first; add only if missing):**
- `header.languageEl`, `header.languageEn` — flag tooltip/aria labels
- `header.toggleTheme` — theme toggle aria label

**Avatar dropdown:**
- `nav.myCourses`, `nav.register` — new (must be added)
- `nav.login` — already exists in locales, do not duplicate
- Existing (no change needed): `nav.editProfile`, `nav.adminPanel`, `nav.logout`

**Edit Profile:**
- `profile.edit.currentPassword`, `profile.edit.newPassword`, `profile.edit.confirmPassword`
- `profile.edit.passwordSection` — section heading
- `profile.edit.provider`, `profile.edit.joinedAt` — account info labels
- `profile.edit.providerCredentials`, `profile.edit.providerGoogle`

**Admin — new sections:**
- `admin.categories.*` — title, empty, loading, modal labels
- `admin.users.*` — title, isAdmin toggle, downloads, purchases column headers
- `admin.stats.*` — card labels (totalUsers, totalLessons, downloads, revenue)
- `admin.modal.create`, `admin.modal.edit`, `admin.modal.delete`, `admin.modal.confirmDelete`, `admin.modal.cancel`

---

## 10. Authentication Flow

### Note on current state
- `session.user` already includes `email` — no session type changes needed.
- The login page already redirects to `/?toast=login` on success, but **nothing currently reads that query param and fires the toast**. The success toast is silent.
- The logout flow in `AppHeader` calls `/api/signout` and navigates to `/` but shows **no success toast**.
- Login errors currently show a generic message regardless of failure reason.

### Successful Login Flow
1. User submits credentials (or completes Google OAuth).
2. On success: set a **`useState` pending toast flag** then navigate cleanly — no query param in the URL:
   ```ts
   const pendingToast = useState<string | null>('pendingToast', () => null)
   pendingToast.value = 'login'
   await navigateTo('/')
   ```
3. The default layout (`app/layouts/default.vue`) reads and clears the flag on mount:
   ```ts
   const pendingToast = useState<string | null>('pendingToast', () => null)
   onMounted(() => {
     if (pendingToast.value === 'login') {
       toast.success(t('auth.login.successToast'))
       pendingToast.value = null
     }
   })
   ```
   The URL stays clean (`/`). The flag lives only in the current browser session — a hard refresh after login simply shows no toast, which is correct behaviour.
4. Remove the existing `?toast=login` query param from the `navigateTo` call in `login.vue`.
5. After navigation, the header dropdown switches to authenticated structure automatically via `useCurrentUser`'s `fetchSession()` on client mount.

### Logout Flow
1. User clicks Logout in the dropdown → confirmation `AlertDialog` opens.
2. User confirms → `POST /api/signout` is called.
3. On success: fire `toast.success(t('auth.logoutConfirm.successToast'))` **before** navigating, then `navigateTo('/')`.
4. After navigation, `useCurrentUser` finds no session → header dropdown switches to unauthenticated structure (Login / Register only).

### Failed Login Flow
1. The credentials callback from `@auth/core` redirects to a URL containing `error=CredentialsSignin` (or similar).
2. The current code detects `redirectUrl.includes('/error') || redirectUrl.includes('error=')` and fires a generic `toast.error(t('auth.login.error.generic'))`.
3. **Improvement:** map the `error` query param value to a specific i18n message:
   - `CredentialsSignin` → `t('auth.login.error.invalidCredentials')` — "Email or password is incorrect"
   - `OAuthAccountNotLinked` → `t('auth.login.error.oauthNotLinked')` — "This email is already registered with a different login method"
   - Any other / unknown → `t('auth.login.error.generic')` — "Something went wrong, please try again"
4. Toast remains on the login page (no redirect on failure — already correct behaviour).

### i18n Keys for Auth Flow
- `auth.login.successToast` — "Welcome back!" (shown on main page after redirect)
- `auth.login.error.invalidCredentials` — "Email or password is incorrect"
- `auth.login.error.oauthNotLinked` — "This email is already registered with a different login method"
- `auth.logoutConfirm.successToast` — "You have been logged out"
