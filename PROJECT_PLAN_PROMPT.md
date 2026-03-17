# MASTER DEVELOPMENT PLAN

Modern Educational Platform

You are building a full educational web application using:

Nuxt 3
Vue 3 (Composition API + <script setup>)
Tailwind CSS
shadcn-vue
GSAP
Auth.js
Supabase (PostgreSQL + Storage)
Stripe
PDF.js
FormSubmit
Vercel
Git + Github for version control and remote repo

No other stack additions allowed.

---

# 1. APPLICATION OVERVIEW

This is a modern educational platform where:

- An educator can upload structured content
- Content can be FREE or PAID
- Students can browse by Grade → Subject → Chapter → Lesson
- Some content requires Stripe purchase
- Files (PDFs etc.) are stored in Supabase Storage
- Admin panel is custom built inside the app
- Application will be strictly in Greek for the Greek public educational system, but all texts will be added to a translations file. Our structure will be in English though obviously.

The platform must feel modern, clean, structured, and educational-focused.

---

# 2. GLOBAL LAYOUT ARCHITECTURE

## 2.1 Main Layout Structure

The application must use a shared layout with:

### A. Top Header Navigation (Global)

Visible on all pages.

Left:

- Logo (links to homepage)

Center:

- Main Page
- Notes (hover dropdown)
- Possibly About
- Possibly Extra Content

Right:

- Theme toggle (dark/light)
- Search bar
- Login/Profile button

---

# 3. HEADER NAVIGATION STRUCTURE

## Notes Dropdown (Multi-Level Hover)

Notes
└── Grade (hoverable)
└── Subject (hoverable)
└── Link to subject page

Structure:

Grade → Subject → Notes

Example:
Notes
Grade 1
Math
Language
Grade 2
Math
Science

This must be dynamically generated from Supabase data.

---

# 4. MAIN PAGE STRUCTURE

The main page ("/") will have:

- Left side vertical navigation bar (same-page routing via anchor scrolling)
- Content sections displayed on the right

Sections:

1. Welcome
2. Information
3. Grades Overview (cards linking to grade pages)
4. Instructions of Use
5. More Content from Educator
6. Communication (FormSubmit contact form)

Scrolling should use:

- Smooth scrolling
- GSAP section reveal animations

---

# 5. ROUTING STRUCTURE

Public Routes:

/
/grade/[grade]
/grade/[grade]/[subject]
/chapter/[chapterId]
/lesson/[lessonId]
/about
/login
/register

Authenticated Routes:

/dashboard
/profile

Admin Routes (protected, admin role only):

/admin
/admin/grades
/admin/subjects
/admin/chapters
/admin/lessons
/admin/categories
/admin/purchases

---

# 6. DATABASE DESIGN (SUPABASE)

Tables:

users

- id
- email
- name
- isAdmin
- created_at

grades

- id
- name
- order

subjects

- id
- name
- grade_id

chapters

- id
- title
- description
- grade_id
- subject_id
- thumbnail_url
- order
- created_at

categories

- id
- name
- description
- order
- created_at

lessons

- id
- chapter_id
- subject_id
- category_id
- title
- content
- is_free
- price
- pdf_url
- order
- created_at

purchases

- id
- user_id
- lesson_id
- stripe_session_id
- created_at

---

# 7. SEARCH FUNCTIONALITY

A search bar must exist in the header.

Search must:

- Query Supabase
- Search lessons and chapters by title
- Display results dropdown live
- Link to lesson/chapter page
- Use debounce before making the query

No external search engine.
Use Supabase queries only.

---

# 8. AUTHENTICATION

Use Auth.js.

Roles:

- admin
- student

Middleware:

- requireAuth
- requireAdmin

Paid content access logic:

- If lesson.is_free → allow
- Else:
  - Verify user logged in
  - Verify purchase exists in purchases table
  - If not → redirect to checkout page

---

# 9. STRIPE PAYMENT FLOW

1. User clicks "Buy Lesson"
2. Nuxt server route creates Stripe Checkout session
3. User pays on Stripe
4. Stripe webhook:
   - Validate signature
   - Insert purchase record in Supabase (per-lesson)
5. User gains access

---

# 10. ADMIN PANEL FEATURES

Admin can:

- Create/edit/delete grades
- Create/edit/delete subjects
- Create/edit/delete chapters
- Create/edit/delete categories
- Create/edit lessons (assigned to chapter, subject, or category)
- Mark lesson as free or paid
- Set price
- Upload PDFs to Supabase Storage
- Attach PDFs to lessons
- View purchases
- View users

Admin UI must use:

- shadcn-vue components
- Clean dashboard layout

---

# 11. PDF VIEWER

Use PDF.js inside lesson page.

Rules:

- Only load PDF if:
  - lesson is free
    OR
  - user has valid purchase

---

# 12. ANIMATIONS

Use GSAP for:

- Section reveals
- Page transitions
- Dropdown smooth animations
- Hero animations
- Subtle admin UI transitions

Do not over-animate.
Educational tone must remain professional.

---

# 13. THEME & LANGUAGE

Theme:

- Light/Dark toggle using Tailwind classes

Language:

- Simple i18n structure
- Store language preference in local storage

---

# 14. SECURITY RULES

- All Stripe secrets server-side only
- Webhooks verified
- Supabase row-level security enforced
- Paid content always validated server-side
- No direct public file URLs without validation

---

# 15. DEPLOYMENT

Deploy to Vercel.

Setup:

- Environment variables
- Stripe webhook production URL
- Supabase production keys

---

# 16. DESIGN PRINCIPLES

- Clean
- Structured
- Modern
- Educational
- Scalable
- Minimal dependencies

Do not add additional libraries unless absolutely necessary.
Follow stack restrictions strictly.
