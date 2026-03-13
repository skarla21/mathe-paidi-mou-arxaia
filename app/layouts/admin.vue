<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from 'vue-sonner'
import { NuxtLink } from '#components'

const { t } = useI18n()

const contentLinks = computed(() => [
  { to: '/admin/grades', label: t('admin.grades') },
  { to: '/admin/subjects', label: t('admin.subjects') },
  { to: '/admin/courses', label: t('admin.courses') },
  { to: '/admin/lessons', label: t('admin.lessons') },
  { to: '/admin/categories', label: t('admin.categories') },
])

const peopleLinks = computed(() => [
  { to: '/admin/users', label: t('admin.users') },
  { to: '/admin/purchases', label: t('admin.purchases') },
])

const mobileMenuOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-muted/30 flex flex-col">
    <Toaster />

    <!-- Mobile top bar -->
    <header class="md:hidden flex items-center gap-3 px-4 py-3 bg-card border-b">
      <NuxtLink to="/admin" class="font-heading font-semibold text-lg flex-1">{{ t('admin.nav') }}</NuxtLink>
      <button
        class="p-1 rounded-md hover:bg-muted"
        :aria-label="mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <span class="block w-5 h-0.5 bg-foreground mb-1" />
        <span class="block w-5 h-0.5 bg-foreground mb-1" />
        <span class="block w-5 h-0.5 bg-foreground" />
      </button>
    </header>

    <!-- Mobile drawer -->
    <div v-if="mobileMenuOpen" class="md:hidden bg-card border-b px-4 py-3 space-y-1">
      <NuxtLink
        to="/admin"
        class="block px-3 py-2 rounded-md text-sm font-heading hover:bg-muted"
        active-class="bg-muted font-medium"
        exact
        @click="mobileMenuOpen = false"
      >
        {{ t('admin.overview') }}
      </NuxtLink>
      <p class="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ t('admin.sectionContent') }}</p>
      <NuxtLink
        v-for="link in contentLinks"
        :key="link.to"
        :to="link.to"
        class="block px-3 py-2 rounded-md text-sm font-heading hover:bg-muted"
        active-class="bg-muted font-medium"
        @click="mobileMenuOpen = false"
      >
        {{ link.label }}
      </NuxtLink>
      <p class="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ t('admin.sectionPeople') }}</p>
      <NuxtLink
        v-for="link in peopleLinks"
        :key="link.to"
        :to="link.to"
        class="block px-3 py-2 rounded-md text-sm font-heading hover:bg-muted"
        active-class="bg-muted font-medium"
        @click="mobileMenuOpen = false"
      >
        {{ link.label }}
      </NuxtLink>
      <NuxtLink
        to="/"
        class="block px-3 py-2 rounded-md text-sm font-heading hover:bg-muted"
        @click="mobileMenuOpen = false"
      >
        {{ t('admin.backToSite') }}
      </NuxtLink>
    </div>

    <!-- Desktop layout -->
    <div class="flex flex-1">
      <aside class="hidden md:flex w-56 border-r bg-card shrink-0 flex-col">
        <div class="p-4 border-b">
          <NuxtLink to="/admin" class="font-heading font-semibold text-lg">{{ t('admin.nav') }}</NuxtLink>
        </div>
        <nav aria-label="Admin navigation" class="p-2 flex-1 space-y-4">
          <div>
            <NuxtLink
              to="/admin"
              class="block px-3 py-2 rounded-md text-sm font-heading hover:bg-muted"
              active-class="bg-muted font-medium"
              exact
            >
              {{ t('admin.overview') }}
            </NuxtLink>
          </div>
          <div>
            <p class="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ t('admin.sectionContent') }}</p>
            <NuxtLink
              v-for="link in contentLinks"
              :key="link.to"
              :to="link.to"
              class="block px-3 py-2 rounded-md text-sm font-heading hover:bg-muted"
              active-class="bg-muted font-medium"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
          <div>
            <p class="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ t('admin.sectionPeople') }}</p>
            <NuxtLink
              v-for="link in peopleLinks"
              :key="link.to"
              :to="link.to"
              class="block px-3 py-2 rounded-md text-sm font-heading hover:bg-muted"
              active-class="bg-muted font-medium"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </nav>
        <div class="p-2 border-t">
          <NuxtLink to="/" class="block px-3 py-2 rounded-md text-sm font-heading hover:bg-muted">
            {{ t('admin.backToSite') }}
          </NuxtLink>
        </div>
      </aside>
      <main class="flex-1 min-h-screen p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
