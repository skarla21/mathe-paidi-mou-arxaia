# Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional Admin Panel with CRUD for all content sections (Grades, Subjects, Courses, Lessons, Categories), a Users management page, an enhanced Purchases page with manual grant access, and a stats Overview dashboard.

**Architecture:** All admin pages follow one pattern: list table + "Add" button → Dialog modal for create/edit + AlertDialog for delete confirm. Each section has dedicated API files (GET already exists, add POST/PATCH/DELETE). Stats are served by a single `/api/admin/stats` endpoint. A new `app/components/ui/dialog/` set mirrors the existing `alert-dialog/` but uses Radix Vue `DialogRoot`.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Tailwind CSS v4, shadcn-vue (AlertDialog for delete confirms), Radix Vue (Dialog for CRUD modals), oh-vue-icons, vue-sonner toasts, Supabase service role.

**Spec:** `docs/superpowers/specs/2026-03-11-header-admin-profile-design.md` §5–8
**Out of scope (covered by Plan 1):** §1–4, §9–10 Header, Auth Flow, Edit Profile

---

## File Map

| File | Action |
|---|---|
| `supabase/schema.sql` | Modify — add lesson_categories, lesson_downloads, courses.thumbnail_url, lessons.category_id + order, CHECK, RLS |
| `app/components/ui/dialog/*.vue` | Create — 9 Dialog UI components |
| `app/layouts/admin.vue` | Modify — remove Uploads, add Categories + Users |
| `app/locales/en.json` + `el.json` + `public/locales/*` | Modify — add admin CRUD + stats keys |
| `server/api/admin/stats.get.ts` | Create |
| `app/pages/admin/index.vue` | Rewrite — stats dashboard |
| `server/api/admin/grades.post.ts` | Create |
| `server/api/admin/grades/[id].patch.ts` | Create |
| `server/api/admin/grades/[id].delete.ts` | Create |
| `app/components/admin/GradeModal.vue` | Create |
| `app/pages/admin/grades.vue` | Rewrite |
| `server/api/admin/subjects.post.ts` | Create |
| `server/api/admin/subjects/[id].patch.ts` | Create |
| `server/api/admin/subjects/[id].delete.ts` | Create |
| `app/components/admin/SubjectModal.vue` | Create |
| `app/pages/admin/subjects.vue` | Rewrite |
| `server/api/admin/courses.post.ts` | Create |
| `server/api/admin/courses/[id].patch.ts` | Create |
| `server/api/admin/courses/[id].delete.ts` | Create |
| `app/components/admin/CourseModal.vue` | Create |
| `app/pages/admin/courses.vue` | Rewrite |
| `server/api/admin/categories.get.ts` | Create |
| `server/api/admin/categories.post.ts` | Create |
| `server/api/admin/categories/[id].patch.ts` | Create |
| `server/api/admin/categories/[id].delete.ts` | Create |
| `app/components/admin/CategoryModal.vue` | Create |
| `app/pages/admin/categories.vue` | Create |
| `server/api/admin/lessons.post.ts` | Create |
| `server/api/admin/lessons/[id].patch.ts` | Create |
| `server/api/admin/lessons/[id].delete.ts` | Create |
| `app/components/admin/LessonModal.vue` | Create |
| `app/pages/admin/lessons.vue` | Rewrite |
| `server/api/admin/users.get.ts` | Create |
| `server/api/admin/users/[id].patch.ts` | Create |
| `server/api/admin/users/[id]/purchases.get.ts` | Create |
| `server/api/admin/users/[id]/downloads.get.ts` | Create |
| `app/components/admin/UserDetailModal.vue` | Create |
| `app/pages/admin/users.vue` | Create |
| `server/api/admin/purchases/grant.post.ts` | Create |
| `app/pages/admin/purchases.vue` | Rewrite |

---

## Chunk 1: Foundation

### Task 1: DB schema migrations

**Files:**
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Append migrations to `supabase/schema.sql`**

```sql
-- ── Plan 2 migrations ──────────────────────────────────────────────────────

-- 1. New: lesson_categories table
CREATE TABLE IF NOT EXISTS public.lesson_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  "order" int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS lesson_categories_order_idx ON public.lesson_categories("order");

-- 2. Lessons: add category_id FK + order column
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.lesson_categories(id) ON DELETE SET NULL;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS "order" int NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS lessons_category_id_idx ON public.lessons(category_id);
CREATE INDEX IF NOT EXISTS lessons_order_idx ON public.lessons("order");

-- 3. Courses: add thumbnail
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- 4. New: lesson_downloads table
CREATE TABLE IF NOT EXISTS public.lesson_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_downloads_user_id_idx ON public.lesson_downloads(user_id);
CREATE INDEX IF NOT EXISTS lesson_downloads_lesson_id_idx ON public.lesson_downloads(lesson_id);
CREATE INDEX IF NOT EXISTS lesson_downloads_at_idx ON public.lesson_downloads(downloaded_at DESC);

-- 5. Lesson assignment CHECK constraint
ALTER TABLE public.lessons ADD CONSTRAINT lessons_assignment_check
  CHECK (
    (course_id IS NOT NULL AND category_id IS NULL) OR
    (course_id IS NULL AND category_id IS NOT NULL) OR
    (course_id IS NULL AND category_id IS NULL)
  );

-- 6. RLS for new tables
ALTER TABLE public.lesson_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_categories_select_all" ON public.lesson_categories FOR SELECT USING (true);
ALTER TABLE public.lesson_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_downloads_select_own" ON public.lesson_downloads FOR SELECT USING (auth.uid() = user_id);
```

- [ ] **Step 2: Run in Supabase SQL editor** — verify all tables/columns exist

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add lesson_categories, lesson_downloads, schema columns for admin panel"
```

---

### Task 2: Create Dialog UI components

**Files:** Create `app/components/ui/dialog/` (9 files)

These mirror `app/components/ui/alert-dialog/` but use Radix Vue `Dialog*` primitives.

- [ ] **Step 1: Create `Dialog.vue`**

```vue
<script setup lang="ts">
import { DialogRoot } from 'radix-vue'
</script>
<template><DialogRoot v-bind="$attrs"><slot /></DialogRoot></template>
```

- [ ] **Step 2: Create `DialogPortal.vue`**

```vue
<script setup lang="ts">
import { DialogPortal } from 'radix-vue'
</script>
<template><DialogPortal><slot /></DialogPortal></template>
```

- [ ] **Step 3: Create `DialogOverlay.vue`**

```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { DialogOverlay } from 'radix-vue'
import { cn } from '~/lib/utils'
interface Props { class?: HTMLAttributes['class'] }
const props = defineProps<Props>()
</script>
<template>
  <DialogOverlay :class="cn('fixed inset-0 z-50 bg-black/80 opacity-0 transition-opacity data-[state=open]:opacity-100', props.class)" />
</template>
```

- [ ] **Step 4: Create `DialogContent.vue`**

```vue
<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { DialogContent as RadixContent } from 'radix-vue'
import { cn } from '~/lib/utils'
interface Props { class?: HTMLAttributes['class'] }
const props = defineProps<Props>()
</script>
<template>
  <RadixContent
    :class="cn('fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg sm:rounded-lg', props.class)"
    v-bind="$attrs"
  ><slot /></RadixContent>
</template>
```

- [ ] **Step 5: Create `DialogHeader.vue`**

```vue
<template><div class="flex flex-col space-y-1.5 text-left"><slot /></div></template>
```

- [ ] **Step 6: Create `DialogFooter.vue`**

```vue
<template><div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><slot /></div></template>
```

- [ ] **Step 7: Create `DialogTitle.vue`**

```vue
<script setup lang="ts">
import { DialogTitle } from 'radix-vue'
</script>
<template><DialogTitle class="text-lg font-semibold leading-none tracking-tight"><slot /></DialogTitle></template>
```

- [ ] **Step 8: Create `DialogDescription.vue`**

```vue
<script setup lang="ts">
import { DialogDescription } from 'radix-vue'
</script>
<template><DialogDescription class="text-sm text-muted-foreground"><slot /></DialogDescription></template>
```

- [ ] **Step 9: Create `DialogClose.vue`**

```vue
<script setup lang="ts">
import { DialogClose } from 'radix-vue'
</script>
<template><DialogClose v-bind="$attrs"><slot /></DialogClose></template>
```

- [ ] **Step 10: Commit**

```bash
git add app/components/ui/dialog/
git commit -m "feat: add Dialog UI components (Radix Vue Dialog primitives)"
```

---

### Task 3: Admin layout update + i18n keys

**Files:**
- Modify: `app/layouts/admin.vue`
- Modify: `app/locales/en.json`, `app/locales/el.json`, `public/locales/en.json`, `public/locales/el.json`

- [ ] **Step 1: Update `admin.vue` sidebar** — replace `links` computed:

```ts
const links = computed(() => [
  { to: '/admin', label: t('admin.overview') },
  { to: '/admin/grades', label: t('admin.grades') },
  { to: '/admin/subjects', label: t('admin.subjects') },
  { to: '/admin/courses', label: t('admin.courses') },
  { to: '/admin/lessons', label: t('admin.lessons') },
  { to: '/admin/categories', label: t('admin.categories') },
  { to: '/admin/users', label: t('admin.users') },
  { to: '/admin/purchases', label: t('admin.purchases') },
])
```

- [ ] **Step 2: Add to `"admin"` object in `en.json`** (keep existing keys):

```json
"categories": "Categories",
"users": "Users",
"categoriesTitle": "Categories",
"categoriesEmpty": "No categories yet.",
"usersTitle": "Users",
"usersEmpty": "No users yet.",
"statsTitle": "Overview",
"stats": {
  "totalUsers": "Total Users",
  "totalLessons": "Total Lessons",
  "downloads": "Downloads",
  "revenue": "Revenue"
},
"recentDownloads": "Recent Downloads",
"topLessons": "Top Lessons",
"noDownloads": "No downloads yet.",
"modal": {
  "create": "Create",
  "edit": "Edit",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "confirmDelete": "Are you sure? This cannot be undone.",
  "deleteTitle": "Confirm Delete"
},
"field": {
  "name": "Name",
  "order": "Order",
  "grade": "Grade",
  "subject": "Subject",
  "title": "Title",
  "description": "Description",
  "isFree": "Free",
  "price": "Price (€)",
  "thumbnailUrl": "Thumbnail URL",
  "content": "Content",
  "pdfUrl": "PDF URL",
  "assignedTo": "Assigned to",
  "course": "Course",
  "category": "Category",
  "isAdmin": "Admin",
  "email": "Email",
  "joinedAt": "Joined",
  "downloads": "Downloads",
  "purchases": "Purchases"
},
"assignCourse": "Part of a course",
"assignCategory": "Standalone category",
"grantAccess": "Grant Access",
"grantSuccess": "Access granted",
"grantError": "Failed to grant access",
"isAdminToggleSuccess": "Admin status updated",
"userDetails": "User Details"
```

- [ ] **Step 3: Add same keys to `el.json`** with Greek:

```json
"categories": "Κατηγορίες",
"users": "Χρήστες",
"categoriesTitle": "Κατηγορίες",
"categoriesEmpty": "Δεν υπάρχουν κατηγορίες ακόμα.",
"usersTitle": "Χρήστες",
"usersEmpty": "Δεν υπάρχουν χρήστες ακόμα.",
"statsTitle": "Επισκόπηση",
"stats": {
  "totalUsers": "Σύνολο χρηστών",
  "totalLessons": "Σύνολο μαθημάτων",
  "downloads": "Λήψεις",
  "revenue": "Έσοδα"
},
"recentDownloads": "Πρόσφατες λήψεις",
"topLessons": "Κορυφαία μαθήματα",
"noDownloads": "Δεν υπάρχουν λήψεις ακόμα.",
"modal": {
  "create": "Δημιουργία",
  "edit": "Επεξεργασία",
  "save": "Αποθήκευση",
  "cancel": "Ακύρωση",
  "delete": "Διαγραφή",
  "confirmDelete": "Είστε σίγουροι; Δεν μπορεί να αναιρεθεί.",
  "deleteTitle": "Επιβεβαίωση διαγραφής"
},
"field": {
  "name": "Όνομα",
  "order": "Σειρά",
  "grade": "Τάξη",
  "subject": "Μάθημα",
  "title": "Τίτλος",
  "description": "Περιγραφή",
  "isFree": "Δωρεάν",
  "price": "Τιμή (€)",
  "thumbnailUrl": "URL εικόνας",
  "content": "Περιεχόμενο",
  "pdfUrl": "URL PDF",
  "assignedTo": "Ανήκει σε",
  "course": "Σειρά μαθημάτων",
  "category": "Κατηγορία",
  "isAdmin": "Διαχειριστής",
  "email": "Email",
  "joinedAt": "Εγγραφή",
  "downloads": "Λήψεις",
  "purchases": "Αγορές"
},
"assignCourse": "Μέρος σειράς μαθημάτων",
"assignCategory": "Αυτόνομη κατηγορία",
"grantAccess": "Χορήγηση πρόσβασης",
"grantSuccess": "Η πρόσβαση χορηγήθηκε",
"grantError": "Αποτυχία χορήγησης",
"isAdminToggleSuccess": "Ο ρόλος διαχειριστή ενημερώθηκε",
"userDetails": "Λεπτομέρειες χρήστη"
```

- [ ] **Step 4: Mirror to `public/locales/`** — apply same additions to `public/locales/en.json` and `public/locales/el.json`

- [ ] **Step 5: Commit**

```bash
git add app/layouts/admin.vue app/locales/ public/locales/
git commit -m "feat: update admin layout sidebar, add admin i18n keys"
```

---

## Chunk 2: Content CRUD

**CRUD pattern (established here, reused in Tasks 5–8):**
- List page: header row (title + Create button) + table with Edit/Delete per row
- `SectionModal.vue`: Dialog with form, props `open` + `item` (null=create), emits `close`/`saved`
- AlertDialog for delete confirmation

**Task 4 shows full code. Tasks 5–8 document only differences.**

---

### Task 4: Grades CRUD

**Files:**
- Create: `server/api/admin/grades.post.ts`
- Create: `server/api/admin/grades/[id].patch.ts`
- Create: `server/api/admin/grades/[id].delete.ts`
- Create: `app/components/admin/GradeModal.vue`
- Rewrite: `app/pages/admin/grades.vue`

- [ ] **Step 1: Create `server/api/admin/grades.post.ts`**

```ts
import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { name, order } = await readBody<{ name: string; order?: number }>(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name is required' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('grades').insert({ name: name.trim(), order: order ?? 0 }).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
```

- [ ] **Step 2: Create `server/api/admin/grades/[id].patch.ts`**

```ts
import { serverSupabaseService } from '../../../../utils/supabaseServer'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ name?: string; order?: number }>(event)
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.order !== undefined) updates.order = body.order
  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: 'Nothing to update' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('grades').update(updates).eq('id', id!).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
```

- [ ] **Step 3: Create `server/api/admin/grades/[id].delete.ts`**

```ts
import { serverSupabaseService } from '../../../../utils/supabaseServer'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const supabase = serverSupabaseService()
  const { error } = await supabase.from('grades').delete().eq('id', id!)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
```

- [ ] **Step 4: Create `app/components/admin/GradeModal.vue`**

```vue
<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogFooter from '~/components/ui/dialog/DialogFooter.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiButton from '~/components/ui/Button.vue'
import UiInput from '~/components/ui/Input.vue'
import UiLabel from '~/components/ui/Label.vue'

const props = defineProps<{
  open: boolean
  grade: { id: string; name: string; order: number } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()

const name = ref('')
const order = ref(0)
const loading = ref(false)

watch(() => props.open, (val) => {
  if (val) {
    name.value = props.grade?.name ?? ''
    order.value = props.grade?.order ?? 0
  }
})

async function onSubmit() {
  if (!name.value.trim()) return
  loading.value = true
  try {
    if (props.grade) {
      await $fetch(`/api/admin/grades/${props.grade.id}`, { method: 'PATCH', body: { name: name.value, order: order.value } })
    } else {
      await $fetch('/api/admin/grades', { method: 'POST', body: { name: name.value, order: order.value } })
    }
    emit('saved')
    emit('close')
  } catch (e: any) {
    toast.error(e?.data?.message ?? t('common.error'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UiDialog :open="props.open" @update:open="(v) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle>{{ props.grade ? t('admin.modal.edit') : t('admin.modal.create') }} — {{ t('admin.grades') }}</UiDialogTitle>
        </UiDialogHeader>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <UiLabel for="grade-name">{{ t('admin.field.name') }}</UiLabel>
            <UiInput id="grade-name" v-model="name" required />
          </div>
          <div class="space-y-1.5">
            <UiLabel for="grade-order">{{ t('admin.field.order') }}</UiLabel>
            <UiInput id="grade-order" v-model.number="order" type="number" min="0" />
          </div>
          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="emit('close')">{{ t('admin.modal.cancel') }}</UiButton>
            <UiButton type="submit" :disabled="loading">{{ loading ? t('common.loading') : t('admin.modal.save') }}</UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
```

- [ ] **Step 5: Rewrite `app/pages/admin/grades.vue`**

```vue
<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
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
import AdminGradeModal from '~/components/admin/GradeModal.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.gradesTitle')}` }))

const grades = ref<any[]>([])
const loading = ref(true)
const modalOpen = ref(false)
const editingGrade = ref<any>(null)
const deleteDialogOpen = ref(false)
const deletingId = ref<string | null>(null)
const deleteLoading = ref(false)

async function fetchGrades() {
  loading.value = true
  try { grades.value = await $fetch('/api/admin/grades') }
  catch { grades.value = [] }
  finally { loading.value = false }
}

onMounted(fetchGrades)

function openCreate() { editingGrade.value = null; modalOpen.value = true }
function openEdit(g: any) { editingGrade.value = g; modalOpen.value = true }
function openDelete(id: string) { deletingId.value = id; deleteDialogOpen.value = true }

async function confirmDelete() {
  if (!deletingId.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/admin/grades/${deletingId.value}`, { method: 'DELETE' })
    await fetchGrades()
    deleteDialogOpen.value = false
  } catch (e: any) {
    toast.error(e?.data?.message ?? t('common.error'))
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold font-heading">{{ t('admin.gradesTitle') }}</h1>
      <UiButton @click="openCreate">+ {{ t('admin.modal.create') }}</UiButton>
    </div>
    <p v-if="loading" class="text-muted-foreground">{{ t('common.loading') }}</p>
    <p v-else-if="!grades.length" class="text-muted-foreground">{{ t('admin.gradesEmpty') }}</p>
    <div v-else class="rounded-md border">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.name') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.order') }}</th>
            <th class="px-4 py-3 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in grades" :key="g.id" class="border-b last:border-0 hover:bg-muted/30">
            <td class="px-4 py-3">{{ g.name }}</td>
            <td class="px-4 py-3">{{ g.order }}</td>
            <td class="px-4 py-3 text-right space-x-2">
              <UiButton size="sm" variant="outline" @click="openEdit(g)">{{ t('admin.modal.edit') }}</UiButton>
              <UiButton size="sm" variant="destructive" @click="openDelete(g.id)">{{ t('admin.modal.delete') }}</UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminGradeModal :open="modalOpen" :grade="editingGrade" @close="modalOpen = false" @saved="fetchGrades" />

    <UiAlertDialogRoot v-model:open="deleteDialogOpen">
      <UiAlertDialogPortal>
        <UiAlertDialogOverlay />
        <UiAlertDialogContent>
          <UiAlertDialogHeader>
            <UiAlertDialogTitle>{{ t('admin.modal.deleteTitle') }}</UiAlertDialogTitle>
            <UiAlertDialogDescription>{{ t('admin.modal.confirmDelete') }}</UiAlertDialogDescription>
          </UiAlertDialogHeader>
          <UiAlertDialogFooter>
            <UiAlertDialogCancel><UiButton variant="outline">{{ t('admin.modal.cancel') }}</UiButton></UiAlertDialogCancel>
            <UiAlertDialogAction as-child>
              <UiButton variant="destructive" :disabled="deleteLoading" @click="confirmDelete">{{ t('admin.modal.delete') }}</UiButton>
            </UiAlertDialogAction>
          </UiAlertDialogFooter>
        </UiAlertDialogContent>
      </UiAlertDialogPortal>
    </UiAlertDialogRoot>
  </div>
</template>
```

- [ ] **Step 6: Verify** — `/admin/grades` — create, edit, delete all work

- [ ] **Step 7: Commit**

```bash
git add server/api/admin/grades.post.ts server/api/admin/grades/ app/components/admin/GradeModal.vue app/pages/admin/grades.vue
git commit -m "feat: add grades CRUD to admin panel"
```

---

### Task 5: Subjects CRUD

**Files:**
- Create: `server/api/admin/subjects.post.ts`, `subjects/[id].patch.ts`, `subjects/[id].delete.ts`
- Create: `app/components/admin/SubjectModal.vue`
- Modify: `server/api/admin/subjects.get.ts`
- Rewrite: `app/pages/admin/subjects.vue`

Follow Task 4 pattern. Key differences:

**`subjects.get.ts`** — update query to join grades:
```ts
const { data, error } = await supabase.from('subjects').select('*, grades(name)').order('name')
```

**`subjects.post.ts`** — body `{ name, grade_id }`, both required:
```ts
// validate: if (!name?.trim() || !grade_id) throw 400
// insert: { name: name.trim(), grade_id }
```

**`subjects/[id].patch.ts`** — updates `{ name?, grade_id? }`, table `subjects`

**`subjects/[id].delete.ts`** — table `subjects`

**`SubjectModal.vue`** — adds grade select field. On open, fetch grades from `/api/admin/grades`:
```vue
<!-- In template, after name input: -->
<div class="space-y-1.5">
  <UiLabel>{{ t('admin.field.grade') }}</UiLabel>
  <select v-model="gradeId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
    <option value="" disabled>Select grade…</option>
    <option v-for="g in grades" :key="g.id" :value="g.id">{{ g.name }}</option>
  </select>
</div>
```

**`subjects.vue`** — same as grades.vue. Table columns: Name, Grade (`s.grades?.name`). Uses `AdminSubjectModal`.

- [ ] **Step 1: Update `subjects.get.ts`** to join grades
- [ ] **Step 2: Create API files** (post, patch, delete)
- [ ] **Step 3: Create `SubjectModal.vue`**
- [ ] **Step 4: Rewrite `subjects.vue`**
- [ ] **Step 5: Verify** — create/edit/delete subjects, grade name shows in list
- [ ] **Step 6: Commit**
```bash
git add server/api/admin/subjects* app/components/admin/SubjectModal.vue app/pages/admin/subjects.vue
git commit -m "feat: add subjects CRUD to admin panel"
```

---

### Task 6: Courses CRUD

**Files:**
- Create: `server/api/admin/courses.post.ts`, `courses/[id].patch.ts`, `courses/[id].delete.ts`
- Create: `app/components/admin/CourseModal.vue`
- Modify: `server/api/admin/courses.get.ts`
- Rewrite: `app/pages/admin/courses.vue`

**`courses.get.ts`** — join subject + grade:
```ts
const { data, error } = await supabase
  .from('courses').select('*, subjects(name, grades(name))').order('created_at', { ascending: false })
```

**`courses.post.ts`** — body `{ title, description?, subject_id, is_free, price?, thumbnail_url? }`. Derive `grade_id` from subject:

```ts
import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{
    title: string; description?: string; subject_id: string
    is_free?: boolean; price?: number; thumbnail_url?: string
  }>(event)
  if (!body.title?.trim() || !body.subject_id) throw createError({ statusCode: 400, message: 'title and subject_id required' })
  const supabase = serverSupabaseService()
  const { data: subject } = await supabase.from('subjects').select('grade_id').eq('id', body.subject_id).single()
  if (!subject) throw createError({ statusCode: 400, message: 'Subject not found' })
  const { data, error } = await supabase.from('courses').insert({
    title: body.title.trim(),
    description: body.description ?? null,
    subject_id: body.subject_id,
    grade_id: subject.grade_id,
    is_free: body.is_free ?? true,
    price: body.is_free ? 0 : (body.price ?? 0),
    thumbnail_url: body.thumbnail_url ?? null,
  }).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
```

**`courses/[id].patch.ts`** — all fields optional; if `subject_id` changes, re-derive `grade_id`.

**`courses/[id].delete.ts`** — table `courses`.

**`CourseModal.vue`** — fields: title, description (textarea), subject select (fetch `/api/admin/subjects`), is_free checkbox, price input (shown when `!isFree`), thumbnail_url text input.

**`courses.vue`** — table columns: thumbnail (small `<img>` if `c.thumbnail_url` else `—`), title, subject name (`c.subjects?.name`), free/paid badge.

- [ ] **Step 1–6:** Same flow as Task 5.

```bash
git add server/api/admin/courses* app/components/admin/CourseModal.vue app/pages/admin/courses.vue
git commit -m "feat: add courses CRUD to admin panel"
```

---

### Task 7: Categories CRUD (new section)

**Files:**
- Create: `server/api/admin/categories.get.ts`, `categories.post.ts`, `categories/[id].patch.ts`, `categories/[id].delete.ts`
- Create: `app/components/admin/CategoryModal.vue`
- Create: `app/pages/admin/categories.vue`

Identical shape to Grades (name + order). Table is `lesson_categories`.

- [ ] **Step 1: Create `categories.get.ts`**

```ts
import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('lesson_categories').select('*').order('order', { ascending: true })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
```

- [ ] **Step 2: Create `categories.post.ts`**

```ts
import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { name, order } = await readBody<{ name: string; order?: number }>(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name is required' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('lesson_categories').insert({ name: name.trim(), order: order ?? 0 }).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
```

- [ ] **Step 3: Create `categories/[id].patch.ts`** — grades patch pattern, table `lesson_categories`

- [ ] **Step 4: Create `categories/[id].delete.ts`** — grades delete pattern, table `lesson_categories`

- [ ] **Step 5: Create `CategoryModal.vue`** — copy GradeModal.vue exactly:
  - Change prop name from `grade` to `category`
  - Change API paths to `/api/admin/categories` and `/api/admin/categories/${id}`
  - Change title: `t('admin.categories')`

- [ ] **Step 6: Create `categories.vue`** — copy grades.vue exactly:
  - Change fetch URL to `/api/admin/categories`
  - Change delete URL to `/api/admin/categories/${id}`
  - Change component to `AdminCategoryModal`
  - Change i18n keys to `categoriesTitle`, `categoriesEmpty`

- [ ] **Step 7: Verify** — `/admin/categories` — full CRUD works

- [ ] **Step 8: Commit**
```bash
git add server/api/admin/categories* app/components/admin/CategoryModal.vue app/pages/admin/categories.vue
git commit -m "feat: add lesson categories CRUD to admin panel"
```

---

### Task 8: Lessons CRUD

**Files:**
- Create: `server/api/admin/lessons.post.ts`, `lessons/[id].patch.ts`, `lessons/[id].delete.ts`
- Create: `app/components/admin/LessonModal.vue`
- Modify: `server/api/admin/lessons.get.ts`
- Rewrite: `app/pages/admin/lessons.vue`

**`lessons.get.ts`** — join course + category:
```ts
const { data, error } = await supabase
  .from('lessons').select('*, courses(title), lesson_categories(name)').order('created_at', { ascending: false })
```

**`lessons.post.ts`**:

```ts
import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{
    title: string; content?: string; is_free?: boolean
    pdf_url?: string; order?: number; course_id?: string | null; category_id?: string | null
  }>(event)
  if (!body.title?.trim()) throw createError({ statusCode: 400, message: 'Title is required' })
  if (body.course_id && body.category_id) {
    throw createError({ statusCode: 400, message: 'Cannot assign to both course and category' })
  }
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('lessons').insert({
    title: body.title.trim(),
    content: body.content ?? null,
    is_free: body.is_free ?? true,
    pdf_url: body.pdf_url ?? null,
    order: body.order ?? 0,
    course_id: body.course_id ?? null,
    category_id: body.category_id ?? null,
  }).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
```

**`lessons/[id].patch.ts`** — same body shape, all fields optional, same course/category validation.

**`lessons/[id].delete.ts`** — grades delete pattern, table `lessons`.

**`LessonModal.vue`** — most complex modal. Fields: title, content (textarea), is_free, pdf_url, order, assignment radio (course|category|none), course select (shown when course), category select (shown when category). Fetch both lists in parallel on open:

```vue
<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogFooter from '~/components/ui/dialog/DialogFooter.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiButton from '~/components/ui/Button.vue'
import UiInput from '~/components/ui/Input.vue'
import UiLabel from '~/components/ui/Label.vue'

const props = defineProps<{
  open: boolean
  lesson: {
    id: string; title: string; content: string | null; is_free: boolean
    pdf_url: string | null; order: number; course_id: string | null; category_id: string | null
  } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()

const title = ref('')
const content = ref('')
const isFree = ref(true)
const pdfUrl = ref('')
const order = ref(0)
const assignment = ref<'course' | 'category' | 'none'>('none')
const courseId = ref('')
const categoryId = ref('')
const courses = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(false)

watch(() => props.open, async (val) => {
  if (!val) return
  title.value = props.lesson?.title ?? ''
  content.value = props.lesson?.content ?? ''
  isFree.value = props.lesson?.is_free ?? true
  pdfUrl.value = props.lesson?.pdf_url ?? ''
  order.value = props.lesson?.order ?? 0
  courseId.value = props.lesson?.course_id ?? ''
  categoryId.value = props.lesson?.category_id ?? ''
  assignment.value = props.lesson?.course_id ? 'course' : props.lesson?.category_id ? 'category' : 'none'
  const [c, cat] = await Promise.all([
    $fetch<any[]>('/api/admin/courses'),
    $fetch<any[]>('/api/admin/categories'),
  ])
  courses.value = c
  categories.value = cat
})

async function onSubmit() {
  loading.value = true
  try {
    const body = {
      title: title.value, content: content.value || null,
      is_free: isFree.value, pdf_url: pdfUrl.value || null, order: order.value,
      course_id: assignment.value === 'course' ? courseId.value || null : null,
      category_id: assignment.value === 'category' ? categoryId.value || null : null,
    }
    if (props.lesson) {
      await $fetch(`/api/admin/lessons/${props.lesson.id}`, { method: 'PATCH', body })
    } else {
      await $fetch('/api/admin/lessons', { method: 'POST', body })
    }
    emit('saved'); emit('close')
  } catch (e: any) {
    toast.error(e?.data?.message ?? t('common.error'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UiDialog :open="props.open" @update:open="(v) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent class="max-w-xl max-h-[90vh] overflow-y-auto">
        <UiDialogHeader>
          <UiDialogTitle>{{ props.lesson ? t('admin.modal.edit') : t('admin.modal.create') }} — {{ t('admin.lessons') }}</UiDialogTitle>
        </UiDialogHeader>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.title') }}</UiLabel>
            <UiInput v-model="title" required />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.content') }}</UiLabel>
            <textarea v-model="content" rows="3" class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div class="flex items-center gap-2">
            <input id="lesson-free" v-model="isFree" type="checkbox" class="h-4 w-4" />
            <UiLabel for="lesson-free">{{ t('admin.field.isFree') }}</UiLabel>
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.pdfUrl') }}</UiLabel>
            <UiInput v-model="pdfUrl" placeholder="https://..." />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.order') }}</UiLabel>
            <UiInput v-model.number="order" type="number" min="0" />
          </div>
          <div class="space-y-1.5">
            <UiLabel>{{ t('admin.field.assignedTo') }}</UiLabel>
            <div class="flex gap-4">
              <label class="flex items-center gap-1.5 text-sm cursor-pointer">
                <input v-model="assignment" type="radio" value="course" /> {{ t('admin.assignCourse') }}
              </label>
              <label class="flex items-center gap-1.5 text-sm cursor-pointer">
                <input v-model="assignment" type="radio" value="category" /> {{ t('admin.assignCategory') }}
              </label>
              <label class="flex items-center gap-1.5 text-sm cursor-pointer">
                <input v-model="assignment" type="radio" value="none" /> None
              </label>
            </div>
          </div>
          <div v-if="assignment === 'course'" class="space-y-1.5">
            <UiLabel>{{ t('admin.field.course') }}</UiLabel>
            <select v-model="courseId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="" disabled>Select course…</option>
              <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.title }}</option>
            </select>
          </div>
          <div v-if="assignment === 'category'" class="space-y-1.5">
            <UiLabel>{{ t('admin.field.category') }}</UiLabel>
            <select v-model="categoryId" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="" disabled>Select category…</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="emit('close')">{{ t('admin.modal.cancel') }}</UiButton>
            <UiButton type="submit" :disabled="loading">{{ loading ? t('common.loading') : t('admin.modal.save') }}</UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
```

**`lessons.vue`** — grades.vue pattern. Table columns: title, assigned-to (`l.courses?.title ?? l.lesson_categories?.name ?? '—'`), free/paid badge, PDF (`l.pdf_url ? '✓' : '✗'`).

- [ ] **Step 1: Update `lessons.get.ts`**
- [ ] **Step 2: Create API files**
- [ ] **Step 3: Create `LessonModal.vue`** (full code above)
- [ ] **Step 4: Rewrite `lessons.vue`**
- [ ] **Step 5: Verify** — create with course assignment, with category assignment
- [ ] **Step 6: Commit**
```bash
git add server/api/admin/lessons* app/components/admin/LessonModal.vue app/pages/admin/lessons.vue
git commit -m "feat: add lessons CRUD with course/category assignment to admin panel"
```

---

## Chunk 3: People + Stats

### Task 9: Users page

**Files:**
- Create: `server/api/admin/users.get.ts`
- Create: `server/api/admin/users/[id].patch.ts`
- Create: `server/api/admin/users/[id]/purchases.get.ts`
- Create: `server/api/admin/users/[id]/downloads.get.ts`
- Create: `app/components/admin/UserDetailModal.vue`
- Create: `app/pages/admin/users.vue`

- [ ] **Step 1: Create `server/api/admin/users.get.ts`**

```ts
import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, "isAdmin", created_at, purchases(count), lesson_downloads(count)')
    .order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return (data ?? []).map((u: any) => ({
    ...u,
    purchaseCount: u.purchases?.[0]?.count ?? 0,
    downloadCount: u.lesson_downloads?.[0]?.count ?? 0,
  }))
})
```

- [ ] **Step 2: Create `server/api/admin/users/[id].patch.ts`**

```ts
import { serverSupabaseService } from '../../../../utils/supabaseServer'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const { isAdmin } = await readBody<{ isAdmin: boolean }>(event)
  if (typeof isAdmin !== 'boolean') throw createError({ statusCode: 400, message: 'isAdmin must be boolean' })
  const supabase = serverSupabaseService()
  // Note: "isAdmin" is a quoted column — Supabase JS client handles it via the JS key
  const { data, error } = await supabase.from('users').update({ isAdmin }).eq('id', id!).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
```

- [ ] **Step 3: Create `server/api/admin/users/[id]/purchases.get.ts`**

```ts
import { serverSupabaseService } from '../../../../../utils/supabaseServer'
import { requireAdmin } from '../../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('purchases').select('*, courses(title)').eq('user_id', id!).order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
```

- [ ] **Step 4: Create `server/api/admin/users/[id]/downloads.get.ts`**

```ts
import { serverSupabaseService } from '../../../../../utils/supabaseServer'
import { requireAdmin } from '../../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('lesson_downloads').select('*, lessons(title)').eq('user_id', id!).order('downloaded_at', { ascending: false }).limit(20)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
```

- [ ] **Step 5: Create `app/components/admin/UserDetailModal.vue`**

```vue
<script setup lang="ts">
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogFooter from '~/components/ui/dialog/DialogFooter.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiButton from '~/components/ui/Button.vue'

const props = defineProps<{ open: boolean; userId: string | null }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

const purchases = ref<any[]>([])
const downloads = ref<any[]>([])
const loading = ref(false)

watch(() => props.open, async (val) => {
  if (!val || !props.userId) return
  loading.value = true
  try {
    const [p, d] = await Promise.all([
      $fetch<any[]>(`/api/admin/users/${props.userId}/purchases`),
      $fetch<any[]>(`/api/admin/users/${props.userId}/downloads`),
    ])
    purchases.value = p
    downloads.value = d
  } catch { /* ignore */ }
  finally { loading.value = false }
})
</script>

<template>
  <UiDialog :open="!!props.open" @update:open="(v) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent class="max-w-lg max-h-[80vh] overflow-y-auto">
        <UiDialogHeader>
          <UiDialogTitle>{{ t('admin.userDetails') }}</UiDialogTitle>
        </UiDialogHeader>
        <div v-if="loading" class="py-4 text-sm text-muted-foreground">{{ t('common.loading') }}</div>
        <div v-else class="space-y-5">
          <div>
            <p class="text-sm font-semibold mb-2">{{ t('admin.field.purchases') }}</p>
            <p v-if="!purchases.length" class="text-xs text-muted-foreground">—</p>
            <ul v-else class="text-xs space-y-1">
              <li v-for="p in purchases" :key="p.id">{{ p.courses?.title }} — {{ new Date(p.created_at).toLocaleDateString() }}</li>
            </ul>
          </div>
          <div>
            <p class="text-sm font-semibold mb-2">{{ t('admin.field.downloads') }}</p>
            <p v-if="!downloads.length" class="text-xs text-muted-foreground">—</p>
            <ul v-else class="text-xs space-y-1">
              <li v-for="d in downloads" :key="d.id">{{ d.lessons?.title }} — {{ new Date(d.downloaded_at).toLocaleDateString() }}</li>
            </ul>
          </div>
        </div>
        <UiDialogFooter>
          <UiButton variant="outline" @click="emit('close')">{{ t('admin.modal.cancel') }}</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
```

- [ ] **Step 6: Create `app/pages/admin/users.vue`**

```vue
<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import AdminUserDetailModal from '~/components/admin/UserDetailModal.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.usersTitle')}` }))

const users = ref<any[]>([])
const loading = ref(true)
const detailUserId = ref<string | null>(null)

async function fetchUsers() {
  loading.value = true
  try { users.value = await $fetch('/api/admin/users') }
  catch { users.value = [] }
  finally { loading.value = false }
}

onMounted(fetchUsers)

async function toggleAdmin(user: any) {
  try {
    await $fetch(`/api/admin/users/${user.id}`, { method: 'PATCH', body: { isAdmin: !user.isAdmin } })
    user.isAdmin = !user.isAdmin
    toast.success(t('admin.isAdminToggleSuccess'))
  } catch (e: any) {
    toast.error(e?.data?.message ?? t('common.error'))
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold font-heading mb-6">{{ t('admin.usersTitle') }}</h1>
    <p v-if="loading" class="text-muted-foreground">{{ t('common.loading') }}</p>
    <p v-else-if="!users.length" class="text-muted-foreground">{{ t('admin.usersEmpty') }}</p>
    <div v-else class="rounded-md border overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.name') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.email') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.joinedAt') }}</th>
            <th class="px-4 py-3 text-center font-medium">{{ t('admin.field.downloads') }}</th>
            <th class="px-4 py-3 text-center font-medium">{{ t('admin.field.purchases') }}</th>
            <th class="px-4 py-3 text-center font-medium">{{ t('admin.field.isAdmin') }}</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-b last:border-0 hover:bg-muted/30">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <img v-if="u.avatar_url" :src="u.avatar_url" class="size-7 rounded-full object-cover" alt="" />
                <VIcon v-else name="bi-person-circle" class="size-7 text-muted-foreground" />
                {{ u.name ?? '—' }}
              </div>
            </td>
            <td class="px-4 py-3 text-xs text-muted-foreground">{{ u.email }}</td>
            <td class="px-4 py-3 text-xs text-muted-foreground">{{ new Date(u.created_at).toLocaleDateString() }}</td>
            <td class="px-4 py-3 text-center">{{ u.downloadCount }}</td>
            <td class="px-4 py-3 text-center">{{ u.purchaseCount }}</td>
            <td class="px-4 py-3 text-center">
              <button
                type="button"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                :class="u.isAdmin ? 'bg-primary' : 'bg-border'"
                @click="toggleAdmin(u)"
              >
                <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform" :class="u.isAdmin ? 'translate-x-4' : 'translate-x-1'" />
              </button>
            </td>
            <td class="px-4 py-3 text-right">
              <UiButton size="sm" variant="outline" @click="detailUserId = u.id">{{ t('admin.userDetails') }}</UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AdminUserDetailModal :open="!!detailUserId" :user-id="detailUserId" @close="detailUserId = null" />
  </div>
</template>
```

- [ ] **Step 7: Verify** — `/admin/users` — list, admin toggle, detail modal

- [ ] **Step 8: Commit**
```bash
git add server/api/admin/users* app/components/admin/UserDetailModal.vue app/pages/admin/users.vue
git commit -m "feat: add users admin page with isAdmin toggle and user detail modal"
```

---

### Task 10: Purchases + grant access

**Files:**
- Create: `server/api/admin/purchases/grant.post.ts`
- Modify: `server/api/admin/purchases.get.ts`
- Rewrite: `app/pages/admin/purchases.vue`

- [ ] **Step 1: Update `purchases.get.ts`** — join user + course:
```ts
const { data, error } = await supabase
  .from('purchases').select('*, users(name, email), courses(title)').order('created_at', { ascending: false })
```

- [ ] **Step 2: Create `server/api/admin/purchases/grant.post.ts`**

```ts
import { serverSupabaseService } from '../../../../utils/supabaseServer'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { userId, courseId } = await readBody<{ userId: string; courseId: string }>(event)
  if (!userId || !courseId) throw createError({ statusCode: 400, message: 'userId and courseId required' })
  const supabase = serverSupabaseService()
  const { data: existing } = await supabase
    .from('purchases').select('id').eq('user_id', userId).eq('course_id', courseId).maybeSingle()
  if (existing) return { ok: true }
  const { error } = await supabase.from('purchases').insert({ user_id: userId, course_id: courseId, stripe_session_id: null })
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
```

- [ ] **Step 3: Rewrite `purchases.vue`**

```vue
<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.purchasesTitle')}` }))

const purchases = ref<any[]>([])
const loading = ref(true)
const grantingId = ref<string | null>(null)

async function fetchPurchases() {
  loading.value = true
  try { purchases.value = await $fetch('/api/admin/purchases') }
  catch { purchases.value = [] }
  finally { loading.value = false }
}

onMounted(fetchPurchases)

async function grantAccess(userId: string, courseId: string) {
  grantingId.value = `${userId}-${courseId}`
  try {
    await $fetch('/api/admin/purchases/grant', { method: 'POST', body: { userId, courseId } })
    toast.success(t('admin.grantSuccess'))
    await fetchPurchases()
  } catch { toast.error(t('admin.grantError')) }
  finally { grantingId.value = null }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold font-heading mb-6">{{ t('admin.purchasesTitle') }}</h1>
    <p v-if="loading" class="text-muted-foreground">{{ t('common.loading') }}</p>
    <div v-else class="rounded-md border overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium">User</th>
            <th class="px-4 py-3 text-left font-medium">Course</th>
            <th class="px-4 py-3 text-left font-medium">Date</th>
            <th class="px-4 py-3 text-left font-medium">Stripe ID</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in purchases" :key="p.id" class="border-b last:border-0 hover:bg-muted/30">
            <td class="px-4 py-3">
              <div class="font-medium">{{ p.users?.name ?? '—' }}</div>
              <div class="text-xs text-muted-foreground">{{ p.users?.email }}</div>
            </td>
            <td class="px-4 py-3">{{ p.courses?.title ?? p.course_id }}</td>
            <td class="px-4 py-3 text-xs text-muted-foreground">{{ new Date(p.created_at).toLocaleDateString() }}</td>
            <td class="px-4 py-3 text-xs text-muted-foreground font-mono">
              {{ p.stripe_session_id ? p.stripe_session_id.slice(0, 16) + '…' : '—' }}
            </td>
            <td class="px-4 py-3 text-right">
              <UiButton
                size="sm" variant="outline"
                :disabled="grantingId === `${p.user_id}-${p.course_id}`"
                @click="grantAccess(p.user_id, p.course_id)"
              >{{ t('admin.grantAccess') }}</UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Verify** — purchases list shows names, Grant Access button works

- [ ] **Step 5: Commit**
```bash
git add server/api/admin/purchases* app/pages/admin/purchases.vue
git commit -m "feat: enhance purchases admin page and add manual grant access"
```

---

### Task 11: Overview stats dashboard

**Files:**
- Create: `server/api/admin/stats.get.ts`
- Rewrite: `app/pages/admin/index.vue`

- [ ] **Step 1: Create `server/api/admin/stats.get.ts`**

```ts
import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()

  const [usersRes, lessonsRes, downloadsRes, revenueRes, recentDownloadsRes, allDownloadsRes] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('lesson_downloads').select('*', { count: 'exact', head: true }),
    supabase.from('purchases').select('courses(price, is_free)'),
    supabase.from('lesson_downloads')
      .select('id, downloaded_at, users(name), lessons(title)')
      .order('downloaded_at', { ascending: false })
      .limit(10),
    supabase.from('lesson_downloads').select('lesson_id, lessons(title)').limit(500),
  ])

  const revenue = (revenueRes.data ?? []).reduce((sum: number, row: any) => {
    if (!row.courses?.is_free) sum += (row.courses?.price ?? 0)
    return sum
  }, 0)

  const lessonCounts: Record<string, { count: number; title: string }> = {}
  for (const d of (allDownloadsRes.data ?? [])) {
    const id = (d as any).lesson_id
    if (!lessonCounts[id]) lessonCounts[id] = { count: 0, title: (d as any).lessons?.title ?? id }
    lessonCounts[id].count++
  }
  const topLessons = Object.entries(lessonCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id, { count, title }]) => ({ lesson_id: id, title, count }))

  return {
    totalUsers: usersRes.count ?? 0,
    totalLessons: lessonsRes.count ?? 0,
    downloads: downloadsRes.count ?? 0,
    revenue,
    recentDownloads: recentDownloadsRes.data ?? [],
    topLessons,
  }
})
```

- [ ] **Step 2: Register missing oh-vue-icons** — read `app/plugins/oh-vue-icons.ts` and add if missing:
  - `BiPeople` (`bi-people`)
  - `BiJournalText` (`bi-journal-text`)
  - `BiDownload` (`bi-download`)
  - `BiCurrencyEuro` (`bi-currency-euro`)

- [ ] **Step 3: Rewrite `app/pages/admin/index.vue`**

```vue
<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiCardHeader from '~/components/ui/CardHeader.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: t('admin.statsTitle') }))

const stats = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try { stats.value = await $fetch('/api/admin/stats') }
  catch { /* render empty */ }
  finally { loading.value = false }
})

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold font-heading">{{ t('admin.statsTitle') }}</h1>
    <p v-if="loading" class="text-muted-foreground">{{ t('common.loading') }}</p>
    <template v-else-if="stats">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <UiCard v-for="card in [
          { label: t('admin.stats.totalUsers'), value: stats.totalUsers, icon: 'bi-people' },
          { label: t('admin.stats.totalLessons'), value: stats.totalLessons, icon: 'bi-journal-text' },
          { label: t('admin.stats.downloads'), value: stats.downloads, icon: 'bi-download' },
          { label: t('admin.stats.revenue'), value: `€${stats.revenue}`, icon: 'bi-currency-euro' },
        ]" :key="card.label">
          <UiCardContent class="flex items-center gap-4 p-5">
            <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <VIcon :name="card.icon" class="size-5 text-primary" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ card.value }}</p>
              <p class="text-xs text-muted-foreground">{{ card.label }}</p>
            </div>
          </UiCardContent>
        </UiCard>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UiCard>
          <UiCardHeader><p class="font-semibold">{{ t('admin.recentDownloads') }}</p></UiCardHeader>
          <UiCardContent>
            <p v-if="!stats.recentDownloads.length" class="text-sm text-muted-foreground">{{ t('admin.noDownloads') }}</p>
            <ul v-else class="space-y-2">
              <li v-for="d in stats.recentDownloads" :key="d.id" class="flex items-center justify-between text-sm">
                <span class="truncate">{{ d.users?.name ?? '—' }} — {{ d.lessons?.title ?? '—' }}</span>
                <span class="ml-2 shrink-0 text-xs text-muted-foreground">{{ timeAgo(d.downloaded_at) }}</span>
              </li>
            </ul>
          </UiCardContent>
        </UiCard>
        <UiCard>
          <UiCardHeader><p class="font-semibold">{{ t('admin.topLessons') }}</p></UiCardHeader>
          <UiCardContent>
            <p v-if="!stats.topLessons.length" class="text-sm text-muted-foreground">{{ t('admin.noDownloads') }}</p>
            <ul v-else class="space-y-2">
              <li v-for="(l, i) in stats.topLessons" :key="l.lesson_id" class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground w-4">{{ i + 1 }}.</span>
                  <span class="truncate">{{ l.title }}</span>
                </span>
                <span class="ml-2 shrink-0 font-medium">{{ l.count }}</span>
              </li>
            </ul>
          </UiCardContent>
        </UiCard>
      </div>
    </template>
  </div>
</template>
```

- [ ] **Step 4: Verify** — `/admin` — 4 stat cards and 2 tables render

- [ ] **Step 5: Commit**
```bash
git add server/api/admin/stats.get.ts app/pages/admin/index.vue app/plugins/oh-vue-icons.ts
git commit -m "feat: add admin overview stats dashboard"
```

---

**Both plans are complete. Execute with superpowers:subagent-driven-development.**
