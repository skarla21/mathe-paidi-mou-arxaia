<script setup lang="ts">
import { toast } from "vue-sonner";
import { NuxtLink } from "#components";
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

const route = useRoute();
const { session, isAdmin } = useCurrentUser();
const { openLogin, openRegister } = useAuthModal();
const { open: openEditProfile } = useEditProfileModal();

const logoRef = ref<HTMLElement | null>(null);
const logoutDialogOpen = ref(false);
const mobileMenuOpen = ref(false);

const homeActive = computed(() => route.path === "/");
const aboutActive = computed(() => route.path === "/about");

function onLogoHover() {
  if (import.meta.client && logoRef.value) {
    const { iconWiggle } = useGsapReveal();
    iconWiggle(logoRef.value as HTMLElement);
  }
}

function openMobileMenu() {
  mobileMenuOpen.value = true;
  if (import.meta.client) document.body.style.overflow = "hidden";
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
  if (import.meta.client) document.body.style.overflow = "";
}

function onMobileNavLink() {
  closeMobileMenu();
}

function goToContact(event: MouseEvent) {
  if (route.path !== "/") return;
  event.preventDefault();
  document
    .getElementById("communication")
    ?.scrollIntoView({ behavior: "smooth" });
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
  toast.success("Αποσυνδεθήκατε");
  await navigateTo("/");
}
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-header-border bg-header-bg/90 shadow-[0_1px_10px_rgba(0,0,0,0.03)] backdrop-blur-xl"
  >
    <div
      class="relative flex h-20 w-full items-center gap-3 px-4 sm:px-6 lg:px-8"
    >
      <NuxtLink
        to="/"
        class="group/logo flex shrink-0 items-center gap-3 text-foreground"
        @mouseenter="onLogoHover"
      >
        <span
          ref="logoRef"
          class="size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20 transition-all group-hover/logo:ring-primary"
          aria-hidden="true"
        >
          <img
            src="/imgs/mathe_arxaia_logo.jpg"
            alt=""
            class="size-full object-cover"
          >
        </span>
        <span
          class="font-brand text-base font-bold leading-tight tracking-tight sm:text-lg group-hover/logo:text-primary transition-colors"
        >
          Μάθε Παιδί Μου Αρχαία!
        </span>
      </NuxtLink>

      <button
        type="button"
        class="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground xl:hidden"
        aria-label="Άνοιγμα μενού πλοήγησης"
        @click="openMobileMenu"
      >
        <VIcon name="bi-list" class="size-5" aria-hidden="true" />
      </button>

      <div
        class="ml-auto hidden items-center gap-4 md:flex xl:absolute xl:left-1/2 xl:ml-0 xl:-translate-x-1/2"
      >
        <nav
          class="hidden items-center gap-4 font-ui text-[15px] font-bold whitespace-nowrap xl:flex"
        >
          <NuxtLink
            to="/"
            class="nav-bobble px-1 py-1"
            :class="
              homeActive
                ? 'text-primary wavy-underline'
                : 'text-muted-foreground hover:text-primary hover-wavy-orange'
            "
            :aria-current="homeActive ? 'page' : undefined"
          >
            Αρχική
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="nav-bobble px-1 py-1"
            :class="
              aboutActive
                ? 'text-[#f59e0b] wavy-amber'
                : 'text-muted-foreground hover:text-[#f59e0b] hover-wavy-amber'
            "
          >
            Σχετικά
          </NuxtLink>
          <LayoutNotesMegaMenu />
          <LayoutExtrasMenu />
          <a
            href="/#communication"
            class="nav-bobble px-1 py-1 text-muted-foreground hover:text-amethyst hover-wavy-purple"
            @click="goToContact"
          >
            Επικοινωνία
          </a>
        </nav>
        <SearchGlobalSearch
          hotkey
          class="w-52 shrink-0 lg:w-64 xl:w-56 2xl:w-64"
        />
      </div>

      <div class="flex shrink-0 items-center gap-2 max-md:ml-auto xl:ml-auto">
        <div class="hidden sm:block">
          <LayoutThemeLanguageControls />
        </div>
        <ClientOnly>
          <UiDropdownMenu v-if="session.user">
            <UiDropdownMenuTrigger as-child>
              <button
                type="button"
                class="flex size-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-muted ring-offset-background transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Μενού χρήστη"
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
              <div
                class="flex items-center gap-3 border-b border-border px-3 py-2.5"
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
                    {{ session.user.name ?? "Χρήστης" }}
                  </p>
                  <p class="mt-0.5 truncate text-xs text-muted-foreground">
                    {{ session.user.email }}
                  </p>
                </div>
              </div>
              <div class="border-b border-border py-1">
                <UiDropdownMenuItem @click="openEditProfile">
                  <span class="flex w-full items-center">
                    <VIcon name="bi-pencil" class="mr-2 size-4 shrink-0" />
                    Επεξεργασία προφίλ
                  </span>
                </UiDropdownMenuItem>
                <UiDropdownMenuItem v-if="!isAdmin">
                  <NuxtLink to="/dashboard" class="flex w-full items-center">
                    <VIcon
                      name="bi-journal-bookmark"
                      class="mr-2 size-4 shrink-0"
                    />
                    Το υλικό μου
                  </NuxtLink>
                </UiDropdownMenuItem>
              </div>
              <div v-if="isAdmin" class="border-b border-border py-1">
                <UiDropdownMenuItem>
                  <NuxtLink to="/admin" class="flex w-full items-center">
                    <VIcon name="bi-gear" class="mr-2 size-4 shrink-0" />
                    Πίνακας διαχείρισης
                  </NuxtLink>
                </UiDropdownMenuItem>
              </div>
              <div class="py-1">
                <UiDropdownMenuItem @click="logoutDialogOpen = true">
                  <VIcon
                    name="bi-box-arrow-right"
                    class="mr-2 size-4 shrink-0"
                  />
                  Αποσύνδεση
                </UiDropdownMenuItem>
              </div>
            </UiDropdownMenuContent>
          </UiDropdownMenu>

          <UiButton
            v-else
            variant="outline"
            size="sm"
            class="rounded-lg border-2 font-semibold"
            @click="openLogin()"
          >
            Σύνδεση
          </UiButton>

          <UiAlertDialogRoot v-model:open="logoutDialogOpen">
            <UiAlertDialogPortal>
              <UiAlertDialogOverlay />
              <UiAlertDialogContent>
                <UiAlertDialogHeader>
                  <UiAlertDialogTitle>Αποσύνδεση</UiAlertDialogTitle>
                  <UiAlertDialogDescription
                    >Είστε σίγουροι ότι θέλετε να
                    αποσυνδεθείτε;</UiAlertDialogDescription
                  >
                </UiAlertDialogHeader>
                <UiAlertDialogFooter>
                  <UiAlertDialogCancel>
                    <UiButton variant="cancel">Ακύρωση</UiButton>
                  </UiAlertDialogCancel>
                  <UiAlertDialogAction as-child>
                    <UiButton variant="destructive" @click="confirmLogout">
                      Αποσύνδεση
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
              aria-label="Μενού χρήστη"
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
        class="fixed inset-0 z-100 flex flex-col overflow-y-auto bg-background/95 backdrop-blur-sm xl:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Μενού πλοήγησης κινητού"
      >
        <div
          class="flex shrink-0 items-center justify-between border-b border-border px-4 py-4"
        >
          <NuxtLink
            to="/"
            class="flex items-center gap-2 text-foreground"
            @click="onMobileNavLink"
          >
            <span class="size-9 shrink-0 overflow-hidden rounded-full">
              <img
                src="/imgs/mathe_arxaia_logo.jpg"
                alt=""
                class="size-full object-cover"
              >
            </span>
            <span class="font-brand text-lg font-bold leading-tight"
              >Μάθε Παιδί Μου Αρχαία!</span
            >
          </NuxtLink>
          <button
            type="button"
            class="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Κλείσιμο μενού πλοήγησης"
            @click="closeMobileMenu"
          >
            <VIcon name="bi-x" class="size-5" aria-hidden="true" />
          </button>
        </div>

        <div class="px-4 pt-4">
          <SearchGlobalSearch class="w-full" />
        </div>

        <nav class="flex flex-1 flex-col gap-1 px-4 py-4">
          <NuxtLink
            to="/"
            class="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
            @click="onMobileNavLink"
          >
            <VIcon
              name="bi-house-door"
              class="size-5 shrink-0"
              aria-hidden="true"
            />
            Αρχική
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
            @click="onMobileNavLink"
          >
            <VIcon
              name="bi-info-circle"
              class="size-5 shrink-0"
              aria-hidden="true"
            />
            Σχετικά
          </NuxtLink>
          <LayoutNotesMegaMenu variant="mobile" @navigate="onMobileNavLink" />
          <LayoutExtrasMenu variant="mobile" @navigate="onMobileNavLink" />
          <a
            href="/#communication"
            class="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
            @click="goToContact"
          >
            <VIcon
              name="bi-chat-dots"
              class="size-5 shrink-0"
              aria-hidden="true"
            />
            Επικοινωνία
          </a>

          <div class="my-3 border-t border-border" />

          <ClientOnly>
            <template v-if="session.user">
              <div class="mb-2 flex items-center gap-3 px-3 py-2">
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
                    {{ session.user.name ?? "Χρήστης" }}
                  </p>
                  <p class="truncate text-xs text-muted-foreground">
                    {{ session.user.email }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                @click="
                  openEditProfile();
                  closeMobileMenu();
                "
              >
                <VIcon
                  name="bi-pencil"
                  class="size-5 shrink-0"
                  aria-hidden="true"
                />
                Επεξεργασία προφίλ
              </button>
              <NuxtLink
                v-if="!isAdmin"
                to="/dashboard"
                class="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                @click="onMobileNavLink"
              >
                <VIcon
                  name="bi-journal-bookmark"
                  class="size-5 shrink-0"
                  aria-hidden="true"
                />
                Το υλικό μου
              </NuxtLink>
              <NuxtLink
                v-if="isAdmin"
                to="/admin"
                class="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                @click="onMobileNavLink"
              >
                <VIcon
                  name="bi-gear"
                  class="size-5 shrink-0"
                  aria-hidden="true"
                />
                Πίνακας διαχείρισης
              </NuxtLink>
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
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
                Αποσύνδεση
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                @click="
                  openLogin();
                  closeMobileMenu();
                "
              >
                <VIcon
                  name="bi-person-circle"
                  class="size-5 shrink-0"
                  aria-hidden="true"
                />
                Σύνδεση
              </button>
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                @click="
                  openRegister();
                  closeMobileMenu();
                "
              >
                <VIcon
                  name="bi-person-plus"
                  class="size-5 shrink-0"
                  aria-hidden="true"
                />
                Εγγραφή
              </button>
            </template>
          </ClientOnly>
        </nav>

        <div
          class="flex shrink-0 items-center gap-3 border-t border-border px-4 py-4 sm:hidden"
        >
          <LayoutThemeLanguageControls />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
