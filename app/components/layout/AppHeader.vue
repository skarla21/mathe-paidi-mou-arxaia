<script setup lang="ts">
import { toast } from "vue-sonner";
import { NuxtLink } from "#components";
import LayoutNotesDropdown from "~/components/layout/NotesDropdown.vue";
import LayoutThemeLanguageControls from "~/components/layout/ThemeLanguageControls.vue";
import SearchGlobalSearch from "~/components/search/GlobalSearch.vue";
import UiButton from "~/components/ui/Button.vue";
import UiDropdownMenu from "~/components/ui/dropdown-menu/DropdownMenu.vue";
import UiDropdownMenuTrigger from "~/components/ui/dropdown-menu/DropdownMenuTrigger.vue";
import UiDropdownMenuContent from "~/components/ui/dropdown-menu/DropdownMenuContent.vue";
import UiDropdownMenuItem from "~/components/ui/dropdown-menu/DropdownMenuItem.vue";
import UiAlertDialogRoot from "~/components/ui/alert-dialog/AlertDialogRoot.vue";
import UiAlertDialogPortal from "~/components/ui/alert-dialog/AlertDialogPortal.vue";
import UiAlertDialogOverlay from "~/components/ui/alert-dialog/AlertDialogOverlay.vue";
import UiAlertDialogContent from "~/components/ui/alert-dialog/AlertDialogContent.vue";
import UiAlertDialogHeader from "~/components/ui/alert-dialog/AlertDialogHeader.vue";
import UiAlertDialogFooter from "~/components/ui/alert-dialog/AlertDialogFooter.vue";
import UiAlertDialogTitle from "~/components/ui/alert-dialog/AlertDialogTitle.vue";
import UiAlertDialogDescription from "~/components/ui/alert-dialog/AlertDialogDescription.vue";
import UiAlertDialogCancel from "~/components/ui/alert-dialog/AlertDialogCancel.vue";
import UiAlertDialogAction from "~/components/ui/alert-dialog/AlertDialogAction.vue";

const { t } = useI18n();
const { session, isAdmin } = useCurrentUser();
const { openLogin, openRegister } = useAuthModal();
const { open: openEditProfile } = useEditProfileModal();

const logoRef = ref<HTMLElement | null>(null);
const logoutDialogOpen = ref(false);
const mobileMenuOpen = ref(false);
const mobileNotesExpanded = ref(false);

// Grades + subjects for the mobile notes tree — shared cache via useGradesData
const { grades, subjects, ensure } = useGradesData();

function subjectsForGrade(gradeId: string) {
  return subjects.value.filter((s) => s.grade_id === gradeId);
}

onMounted(ensure);

function onLogoHover() {
  if (import.meta.client && logoRef.value) {
    const { iconWiggle } = useGsapReveal();
    iconWiggle(logoRef.value as HTMLElement);
  }
}

function openMobileMenu() {
  mobileMenuOpen.value = true;
  if (import.meta.client) {
    document.body.style.overflow = "hidden";
  }
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
  mobileNotesExpanded.value = false;
  if (import.meta.client) {
    document.body.style.overflow = "";
  }
}

function onMobileNavLink() {
  closeMobileMenu();
}

async function confirmLogout() {
  try {
    await $fetch<{ success: boolean }>("/api/signout", { method: "POST" });
  } catch {
    // ignore errors — sign out regardless
  }
  session.value.user = null;
  closeMobileMenu();
  toast.success(t("auth.logoutConfirm.successToast"));
  await navigateTo("/");
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
        <span
          class="font-heading font-bold text-lg sm:text-xl leading-tight group-hover/logo:text-primary transition-colors"
        >
          {{ t("brand.logo") }}
        </span>
      </NuxtLink>

      <!-- Hamburger — mobile only, after logo -->
      <button
        type="button"
        class="md:hidden flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        :aria-label="t('nav.openMenu')"
        @click="openMobileMenu"
      >
        <VIcon name="bi-list" class="size-5" aria-hidden="true" />
      </button>

      <!-- Centre nav — desktop only -->
      <nav
        class="hidden md:flex items-center gap-6 lg:gap-8 flex-1 justify-center"
      >
        <NuxtLink
          to="/"
          class="font-heading flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground nav-link-underline transition-colors"
        >
          <VIcon name="bi-house-door" class="size-4" aria-hidden="true" />
          {{ t("nav.main") }}
        </NuxtLink>
        <LayoutNotesDropdown />
        <NuxtLink
          to="/about"
          class="font-heading flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground nav-link-underline transition-colors"
        >
          <VIcon name="bi-info-circle" class="size-4" aria-hidden="true" />
          {{ t("nav.about") }}
        </NuxtLink>
      </nav>

      <!-- Right controls -->
      <div class="flex items-center gap-2 shrink-0 ml-auto">
        <!-- Search -->
        <SearchGlobalSearch class="w-48 lg:w-64" />

        <LayoutThemeLanguageControls />

        <!-- Avatar button + dropdown (authenticated) / Σύνδεση button (unauthenticated) -->
        <ClientOnly>
          <!-- Authenticated: avatar + dropdown -->
          <UiDropdownMenu v-if="session.user">
            <UiDropdownMenuTrigger as-child>
              <button
                type="button"
                class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-muted ring-offset-background transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                :aria-label="t('nav.userMenu')"
              >
                <img
                  v-if="session.user.avatar_url"
                  :src="session.user.avatar_url"
                  :alt="session.user.name ?? ''"
                  class="size-full object-cover"
                >
                <span
                  v-else
                  class="flex size-full items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <VIcon
                    name="bi-person-fill"
                    class="size-5"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </UiDropdownMenuTrigger>

            <UiDropdownMenuContent align="end" class="min-w-52">
              <!-- User info header (non-interactive) -->
              <div
                class="flex items-center gap-3 px-3 py-2.5 border-b border-border"
              >
                <div
                  class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted"
                >
                  <img
                    v-if="session.user.avatar_url"
                    :src="session.user.avatar_url"
                    :alt="session.user.name ?? ''"
                    class="size-full object-cover"
                  >
                  <VIcon
                    v-else
                    name="bi-person-fill"
                    class="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium leading-none">
                    {{ session.user.name ?? t("nav.user") }}
                  </p>
                  <p class="truncate text-xs text-muted-foreground mt-0.5">
                    {{ session.user.email }}
                  </p>
                </div>
              </div>

              <!-- Nav links -->
              <div class="py-1 border-b border-border">
                <UiDropdownMenuItem @click="openEditProfile">
                  <span class="flex items-center w-full">
                    <VIcon name="bi-pencil" class="mr-2 size-4 shrink-0" />
                    {{ t("nav.editProfile") }}
                  </span>
                </UiDropdownMenuItem>
                <UiDropdownMenuItem v-if="!isAdmin">
                  <NuxtLink to="/dashboard" class="flex items-center w-full">
                    <VIcon
                      name="bi-journal-bookmark"
                      class="mr-2 size-4 shrink-0"
                    />
                    {{ t("nav.myCourses") }}
                  </NuxtLink>
                </UiDropdownMenuItem>
              </div>

              <!-- Admin (admins only) -->
              <div v-if="isAdmin" class="py-1 border-b border-border">
                <UiDropdownMenuItem>
                  <NuxtLink to="/admin" class="flex items-center w-full">
                    <VIcon name="bi-gear" class="mr-2 size-4 shrink-0" />
                    {{ t("nav.adminPanel") }}
                  </NuxtLink>
                </UiDropdownMenuItem>
              </div>

              <!-- Logout -->
              <div class="py-1">
                <UiDropdownMenuItem @click="logoutDialogOpen = true">
                  <VIcon
                    name="bi-box-arrow-right"
                    class="mr-2 size-4 shrink-0"
                  />
                  {{ t("nav.logout") }}
                </UiDropdownMenuItem>
              </div>
            </UiDropdownMenuContent>
          </UiDropdownMenu>

          <!-- Unauthenticated: plain login button -->
          <UiButton
            v-else
            size="sm"
            @click="openLogin()"
          >
            {{ t("nav.login") }}
          </UiButton>

          <!-- Logout confirmation dialog -->
          <UiAlertDialogRoot v-model:open="logoutDialogOpen">
            <UiAlertDialogPortal>
              <UiAlertDialogOverlay />
              <UiAlertDialogContent>
                <UiAlertDialogHeader>
                  <UiAlertDialogTitle>{{
                    t("auth.logoutConfirm.title")
                  }}</UiAlertDialogTitle>
                  <UiAlertDialogDescription>{{
                    t("auth.logoutConfirm.description")
                  }}</UiAlertDialogDescription>
                </UiAlertDialogHeader>
                <UiAlertDialogFooter>
                  <UiAlertDialogCancel>
                    <UiButton variant="cancel">{{
                      t("auth.logoutConfirm.cancel")
                    }}</UiButton>
                  </UiAlertDialogCancel>
                  <UiAlertDialogAction as-child>
                    <UiButton variant="destructive" @click="confirmLogout">
                      {{ t("auth.logoutConfirm.confirm") }}
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
              :aria-label="t('nav.userMenu')"
            >
              <VIcon
                name="bi-person-circle"
                class="size-6 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
          </template>
        </ClientOnly>
      </div>
    </div>
  </header>

  <!-- Mobile drawer -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col md:hidden overflow-y-auto"
        role="dialog"
        aria-modal="true"
        :aria-label="t('nav.mobileMenu')"
      >
        <!-- Drawer header -->
        <div
          class="flex items-center justify-between px-4 py-4 border-b border-border shrink-0"
        >
          <NuxtLink
            to="/"
            class="flex items-center gap-2 text-foreground"
            @click="onMobileNavLink"
          >
            <span
              class="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20"
            >
              <VIcon
                name="bi-journal-bookmark-fill"
                class="size-4"
                aria-hidden="true"
              />
            </span>
            <span class="font-heading font-bold text-lg leading-tight">
              {{ t("brand.logo") }}
            </span>
          </NuxtLink>

          <button
            type="button"
            class="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            :aria-label="t('nav.closeMenu')"
            @click="closeMobileMenu"
          >
            <VIcon name="bi-x" class="size-5" aria-hidden="true" />
          </button>
        </div>

        <!-- Drawer body -->
        <nav class="flex flex-col flex-1 px-4 py-6 gap-1">
          <!-- Home -->
          <NuxtLink
            to="/"
            class="font-heading flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            @click="onMobileNavLink"
          >
            <VIcon
              name="bi-house-door"
              class="size-5 shrink-0"
              aria-hidden="true"
            />
            {{ t("nav.main") }}
          </NuxtLink>

          <!-- Notes — expandable -->
          <div>
            <button
              type="button"
              class="font-heading w-full flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              :aria-expanded="mobileNotesExpanded"
              @click="mobileNotesExpanded = !mobileNotesExpanded"
            >
              <VIcon
                name="bi-journal-text"
                class="size-5 shrink-0"
                aria-hidden="true"
              />
              <span class="flex-1 text-left">{{ t("nav.notes") }}</span>
              <VIcon
                name="bi-chevron-down"
                class="size-4 text-muted-foreground transition-transform duration-200"
                :class="mobileNotesExpanded ? 'rotate-180' : ''"
                aria-hidden="true"
              />
            </button>

            <Transition
              enter-active-class="transition-all duration-200 ease-out overflow-hidden"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-screen opacity-100"
              leave-active-class="transition-all duration-150 ease-in overflow-hidden"
              leave-from-class="max-h-screen opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div
                v-if="mobileNotesExpanded"
                class="ml-4 mt-1 flex flex-col gap-1 border-l border-border pl-4"
              >
                <template v-for="grade in grades" :key="grade.id">
                  <p
                    class="px-2 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {{ grade.name }}
                  </p>
                  <NuxtLink
                    v-for="subj in subjectsForGrade(grade.id)"
                    :key="subj.id"
                    :to="`/grade/${grade.id}/${subj.id}`"
                    class="rounded-md px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    @click="onMobileNavLink"
                  >
                    {{ subj.name }}
                  </NuxtLink>
                </template>
                <p
                  v-if="grades.length === 0"
                  class="px-2 py-2 text-sm text-muted-foreground"
                >
                  {{ t("notes.empty") }}
                </p>
              </div>
            </Transition>
          </div>

          <!-- About -->
          <NuxtLink
            to="/about"
            class="font-heading flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            @click="onMobileNavLink"
          >
            <VIcon
              name="bi-info-circle"
              class="size-5 shrink-0"
              aria-hidden="true"
            />
            {{ t("nav.about") }}
          </NuxtLink>

          <!-- Divider -->
          <div class="my-3 border-t border-border" />

          <!-- Authenticated user links -->
          <ClientOnly>
            <template v-if="session.user">
              <!-- User info row -->
              <div class="flex items-center gap-3 px-3 py-2 mb-2">
                <div
                  class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted"
                >
                  <img
                    v-if="session.user.avatar_url"
                    :src="session.user.avatar_url"
                    :alt="session.user.name ?? ''"
                    class="size-full object-cover"
                  >
                  <VIcon
                    v-else
                    name="bi-person-fill"
                    class="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">
                    {{ session.user.name ?? t("nav.user") }}
                  </p>
                  <p class="truncate text-xs text-muted-foreground">
                    {{ session.user.email }}
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="font-heading flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
                @click="openEditProfile(); closeMobileMenu()"
              >
                <VIcon
                  name="bi-pencil"
                  class="size-5 shrink-0"
                  aria-hidden="true"
                />
                {{ t("nav.editProfile") }}
              </button>

              <NuxtLink
                v-if="!isAdmin"
                to="/dashboard"
                class="font-heading flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                @click="onMobileNavLink"
              >
                <VIcon
                  name="bi-journal-bookmark"
                  class="size-5 shrink-0"
                  aria-hidden="true"
                />
                {{ t("nav.myCourses") }}
              </NuxtLink>

              <NuxtLink
                v-if="isAdmin"
                to="/admin"
                class="font-heading flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                @click="onMobileNavLink"
              >
                <VIcon
                  name="bi-gear"
                  class="size-5 shrink-0"
                  aria-hidden="true"
                />
                {{ t("nav.adminPanel") }}
              </NuxtLink>

              <button
                type="button"
                class="font-heading flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
                @click="
                  logoutDialogOpen = true;
                  closeMobileMenu();
                "
              >
                <VIcon
                  name="bi-box-arrow-right"
                  class="size-5 shrink-0"
                  aria-hidden="true"
                />
                {{ t("nav.logout") }}
              </button>
            </template>

            <!-- Guest links -->
            <template v-else>
              <button
                type="button"
                class="font-heading flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
                @click="openLogin(); closeMobileMenu()"
              >
                <VIcon
                  name="bi-person-circle"
                  class="size-5 shrink-0"
                  aria-hidden="true"
                />
                {{ t("nav.login") }}
              </button>

              <button
                type="button"
                class="font-heading flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
                @click="openRegister(); closeMobileMenu()"
              >
                <VIcon
                  name="bi-person-plus"
                  class="size-5 shrink-0"
                  aria-hidden="true"
                />
                {{ t("nav.register") }}
              </button>
            </template>
          </ClientOnly>
        </nav>

        <!-- Drawer footer: language + theme -->
        <div
          class="shrink-0 border-t border-border px-4 py-4 flex items-center gap-3"
        >
          <LayoutThemeLanguageControls />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
