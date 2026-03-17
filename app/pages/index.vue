<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { toast } from "vue-sonner";
import UiButton from "~/components/ui/Button.vue";
import UiCard from "~/components/ui/Card.vue";
import UiCardHeader from "~/components/ui/CardHeader.vue";
import UiCardTitle from "~/components/ui/CardTitle.vue";
import UiCardContent from "~/components/ui/CardContent.vue";
import UiInput from "~/components/ui/Input.vue";
import UiTextarea from "~/components/ui/Textarea.vue";
import UiLabel from "~/components/ui/Label.vue";

definePageMeta({ hideLayoutFooter: true })

const { t } = useI18n();
const route = useRoute();
const {
  revealSection,
  revealStagger,
  animateHero,
  animateBadge,
  parallaxBlobs,
  heroFadeOnScroll,
  iconWiggle,
} = useGsapReveal();

const sectionConfig = [
  { id: "welcome", labelKey: "home.section.welcome", icon: "bi-stars" },
  { id: "information", labelKey: "home.section.information", icon: "bi-info-circle" },
  { id: "grades", labelKey: "home.section.grades", icon: "bi-mortarboard" },
  { id: "instructions", labelKey: "home.section.instructions", icon: "bi-list-check" },
  { id: "more", labelKey: "home.section.more", icon: "bi-gem" },
  { id: "communication", labelKey: "home.section.communication", icon: "bi-chat-dots" },
];

const sections = computed(() =>
  sectionConfig.map((s) => ({ id: s.id, label: t(s.labelKey), icon: s.icon }))
);

const grades = ref<{ id: string; name: string; order: number }[]>([]);
const fetchError = ref(false);
const activeSection = ref<string>("welcome");
const scrollContainerRef = ref<HTMLElement | null>(null);
const gradesGrid = ref<HTMLElement | null>(null);

// Contact form state
const email = ref("");
const message = ref("");
const submitting = ref(false);
const submitted = ref(false);

// scroll listener reference for cleanup
let updateActiveSection: (() => void) | null = null;

function scrollTo(id: string) {
  const container = scrollContainerRef.value;
  const el = document.getElementById(id);
  if (!container || !el) return;
  const targetTop = el.offsetTop;
  container.scrollTo({ top: targetTop, behavior: "smooth" });
}

async function submitContact() {
  submitting.value = true;
  try {
    await $fetch("/api/contact", {
      method: "POST",
      body: { email: email.value, message: message.value },
    });
    toast.success(t("home.communication.successToast"));
    submitted.value = true;
  } catch {
    toast.error(t("home.communication.errorToast"));
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  try {
    const data = await $fetch<typeof grades.value>("/api/grades");
    grades.value = data ?? [];
  } catch {
    grades.value = [];
    fetchError.value = true;
  }
  if (import.meta.client) {
    nextTick(() => {
      const container = scrollContainerRef.value;
      const scroller = container ?? undefined;
      sections.value.forEach((s) => revealSection(`#${s.id}`, { scroller: scroller as HTMLElement | undefined }));
      revealStagger("#information ul", "li", { scroller: scroller as HTMLElement | undefined });
      revealStagger("#instructions ol", "li", { scroller: scroller as HTMLElement | undefined });
      revealStagger("#more ul", "li", { scroller: scroller as HTMLElement | undefined });
      if (gradesGrid.value && grades.value.length > 0) {
        revealStagger("#grades-grid", "a", { scroller: scroller as HTMLElement | undefined });
      }
      animateBadge("#hero-badge");
      animateHero("#hero-title", "#hero-lead", "#hero-cta");
      const heroBlobs = document.querySelector("#hero-blobs");
      if (heroBlobs && container) {
        parallaxBlobs("#welcome", container as HTMLElement);
        heroFadeOnScroll("#hero-blobs", container as HTMLElement);
      }

      if (!container) return;
      updateActiveSection = () => {
        const c = scrollContainerRef.value;
        if (!c) return;
        const scrollTop = c.scrollTop;
        const viewportMid = scrollTop + c.clientHeight * 0.35;
        const secs = sections.value;
        let active = secs[0]?.id ?? "welcome";
        for (let i = secs.length - 1; i >= 0; i--) {
          const sec = secs[i];
          if (!sec) continue;
          const el = document.getElementById(sec.id);
          if (el && el.offsetTop <= viewportMid) {
            active = sec.id;
            break;
          }
        }
        activeSection.value = active;
      };
      container.addEventListener("scroll", updateActiveSection, { passive: true });
      updateActiveSection();

      if (route.path === "/" && (route.hash === "#welcome" || !route.hash)) {
        scrollTo("welcome");
      }
    });
  }
});

onBeforeUnmount(() => {
  const container = scrollContainerRef.value;
  if (container && updateActiveSection) {
    container.removeEventListener("scroll", updateActiveSection);
  }
});

function onNavClick(id: string, ev: MouseEvent) {
  const btn = (ev.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-icon]");
  if (btn && import.meta.client) {
    iconWiggle(btn);
  }
  scrollTo(id);
}
</script>

<template>
  <div class="flex min-h-0 flex-1 w-full min-w-0 overflow-hidden">
    <nav
      class="sticky top-16 sm:top-20 self-start w-52 border-r border-border/50 p-4 shrink-0 hidden lg:block bg-background"
    >
      <ul class="space-y-1">
        <li v-for="s in sections" :key="s.id">
          <UiButton
            type="button"
            variant="ghost"
            :class="[
              'font-heading w-full justify-start px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
              activeSection === s.id
                ? 'bg-primary/10 text-primary font-medium border-l-2 border-l-primary pl-[10px] -ml-px'
                : 'hover:bg-accent/70 border-l-2 border-l-transparent',
            ]"
            @click="onNavClick(s.id, $event)"
          >
            <VIcon :name="s.icon" class="size-4 shrink-0 text-primary" data-icon aria-hidden="true" />
            {{ s.label }}
          </UiButton>
        </li>
      </ul>
    </nav>
    <div ref="scrollContainerRef" class="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
      <section
        id="welcome"
        class="relative w-full py-24 lg:py-32 px-4 sm:px-6 lg:px-8 border-b border-border/50"
      >
        <div class="max-w-7xl mx-auto">
        <div
          id="hero-blobs"
          class="absolute inset-0 z-0 opacity-30 dark:opacity-10 pointer-events-none overflow-hidden"
        >
          <div
            class="absolute -top-40 -right-40 w-96 h-96 bg-amber-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob"
          />
          <div
            class="absolute top-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000"
          />
          <div
            class="absolute -bottom-40 left-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-4000"
          />
        </div>

        <div class="relative z-10 max-w-4xl mx-auto">
          <div
            id="hero-badge"
            class="font-display inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 text-accent mb-8 border border-accent/30 shadow-sm"
          >
            <VIcon name="bi-stars" class="size-4" aria-hidden="true" />
            <span class="text-sm font-semibold tracking-wide uppercase">{{ t("home.welcome.badge") }}</span>
          </div>

          <h1
            id="hero-title"
            class="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight"
          >
            {{ t("home.welcome.title") }}
          </h1>
          <p
            id="hero-lead"
            class="mt-6 text-muted-foreground text-lg sm:text-xl max-w-2xl leading-relaxed font-heading"
          >
            {{ t("home.welcome.lead") }}
          </p>

          <div id="hero-cta" class="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <UiButton
              type="button"
              variant="default"
              class="relative group overflow-hidden w-full sm:w-auto px-8 py-4 rounded-xl text-lg shadow-lg active:scale-95"
              @click="scrollTo('grades')"
            >
              <span class="relative z-20 flex items-center gap-2">
                {{ t("home.welcome.cta") }}
                <VIcon name="bi-arrow-right" class="size-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <span
                class="absolute inset-0 z-10 bg-black/15 dark:bg-white/15 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"
              />
            </UiButton>
            <button
              type="button"
              class="relative group w-full sm:w-auto px-8 py-4 rounded-xl bg-card text-card-foreground font-semibold text-lg border border-border flex items-center justify-center gap-2 transition-all hover:border-transparent active:scale-95"
              @click="scrollTo('information')"
            >
              <span class="relative z-20 flex items-center gap-2 group-hover:text-primary transition-colors">
                <VIcon name="bi-journal-bookmark" class="size-5 text-accent group-hover:scale-110 transition-transform" />
                {{ t("home.welcome.ctaSecondary") }}
              </span>
              <span
                class="absolute inset-0 z-10 bg-muted scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out rounded-xl"
              />
            </button>
          </div>
        </div>
        </div>
      </section>

      <section id="information" class="w-full py-20 px-4 sm:px-6 lg:px-8 border-b border-border/50">
        <div class="max-w-7xl mx-auto">
        <div class="border-l-4 border-l-primary/20 pl-4 rounded-l">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div>
              <h2 class="font-heading text-2xl md:text-3xl font-semibold flex items-center gap-2 text-foreground">
                <VIcon name="bi-info-circle" class="size-7 text-primary" aria-hidden="true" />
                {{ t("home.info.title") }}
              </h2>
              <p class="mt-3 text-muted-foreground max-w-2xl font-heading leading-relaxed">
                {{ t("home.info.body") }}
              </p>
            </div>
            <div class="flex shrink-0 size-16 md:size-20 rounded-2xl bg-primary/10 items-center justify-center">
              <VIcon name="bi-journal-bookmark" class="size-8 md:size-10 text-primary" aria-hidden="true" />
            </div>
          </div>
          <ul class="mt-8 space-y-4 max-w-2xl">
            <li class="flex items-start gap-3">
              <span class="mt-0.5 shrink-0 text-primary" aria-hidden="true">
                <VIcon name="bi-check2-circle" class="size-5" />
              </span>
              <span class="text-muted-foreground leading-relaxed font-heading">{{ t("home.info.bullet1") }}</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="mt-0.5 shrink-0 text-primary" aria-hidden="true">
                <VIcon name="bi-check2-circle" class="size-5" />
              </span>
              <span class="text-muted-foreground leading-relaxed font-heading">{{ t("home.info.bullet2") }}</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="mt-0.5 shrink-0 text-primary" aria-hidden="true">
                <VIcon name="bi-check2-circle" class="size-5" />
              </span>
              <span class="text-muted-foreground leading-relaxed font-heading">{{ t("home.info.bullet3") }}</span>
            </li>
          </ul>
          <p class="mt-6 text-muted-foreground max-w-2xl font-heading text-sm leading-relaxed border-l-2 border-l-primary/30 pl-4">
            {{ t("home.info.extra") }}
          </p>
        </div>
        </div>
      </section>

      <section id="grades" class="w-full py-20 px-4 sm:px-6 lg:px-8 border-b border-border/50 bg-muted/30">
        <div class="max-w-7xl mx-auto">
        <h2 class="font-heading text-2xl md:text-3xl font-semibold flex items-center gap-2 text-foreground mb-6">
          <VIcon name="bi-mortarboard" class="size-7 text-primary" aria-hidden="true" />
          {{ t("home.grades.title") }}
        </h2>
        <div v-if="fetchError && grades.length === 0" class="rounded-xl border border-dashed border-destructive/50 bg-destructive/5 p-6 text-center max-w-md">
          <p class="text-muted-foreground">
            {{ t("common.error") }}
          </p>
        </div>
        <div v-else>
          <div id="grades-grid" ref="gradesGrid" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
              v-for="g in grades"
              :key="g.id"
              :to="`/grade/${g.id}`"
              class="block group relative"
            >
              <UiCard
                class="relative rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:scale-[1.02] border-border/80 overflow-hidden"
              >
                <svg
                  class="draw-border-svg absolute -inset-px w-[calc(100%+8px)] h-[calc(100%+8px)] -top-1 -left-1 pointer-events-none z-10 text-amber-500 hidden md:block"
                  viewBox="0 0 200 120"
                  preserveAspectRatio="none"
                >
                  <rect
                    x="2"
                    y="2"
                    width="196"
                    height="116"
                    rx="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="draw-border-path"
                  />
                </svg>
                <UiCardHeader class="flex flex-row items-center gap-3">
                  <span
                    class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <VIcon name="bi-journal-bookmark" class="size-5" />
                  </span>
                  <UiCardTitle class="font-heading text-lg">{{ g.name }}</UiCardTitle>
                </UiCardHeader>
                <UiCardContent>
                  <p class="text-sm text-muted-foreground leading-relaxed">
                    {{ t("home.grades.cardHint") }}
                  </p>
                </UiCardContent>
              </UiCard>
            </NuxtLink>
          </div>
          <div v-if="grades.length === 0" class="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center max-w-md">
            <VIcon name="bi-inbox" class="size-10 mx-auto text-muted-foreground/70" aria-hidden="true" />
            <p class="mt-3 text-muted-foreground">
              {{ t("home.grades.empty") }}
            </p>
            <p class="mt-1 text-sm text-muted-foreground/80">
              {{ t("home.grades.emptyHint") }}
            </p>
          </div>
        </div>
        </div>
      </section>

      <section id="instructions" class="w-full py-20 px-4 sm:px-6 lg:px-8 border-b border-border/50">
        <div class="max-w-7xl mx-auto">
        <h2 class="font-heading text-2xl md:text-3xl font-semibold flex items-center gap-2 text-foreground">
          <VIcon name="bi-list-check" class="size-7 text-primary" aria-hidden="true" />
          {{ t("home.instructions.title") }}
        </h2>
        <p class="mt-3 text-muted-foreground max-w-2xl font-heading leading-relaxed">
          {{ t("home.instructions.body") }}
        </p>
        <ol class="mt-6 space-y-4 max-w-2xl list-none">
          <li class="flex items-start gap-3">
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary font-semibold text-sm"
              aria-hidden="true"
            >
              1
            </span>
            <span class="text-muted-foreground leading-relaxed pt-0.5 font-heading">{{ t("home.instructions.step1") }}</span>
          </li>
          <li class="flex items-start gap-3">
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary font-semibold text-sm"
              aria-hidden="true"
            >
              2
            </span>
            <span class="text-muted-foreground leading-relaxed pt-0.5 font-heading">{{ t("home.instructions.step2") }}</span>
          </li>
          <li class="flex items-start gap-3">
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary font-semibold text-sm"
              aria-hidden="true"
            >
              3
            </span>
            <span class="text-muted-foreground leading-relaxed pt-0.5 font-heading">{{ t("home.instructions.step3") }}</span>
          </li>
        </ol>
        </div>
      </section>

      <section id="more" class="w-full py-20 px-4 sm:px-6 lg:px-8 border-b border-border/50">
        <div class="max-w-7xl mx-auto">
        <h2 class="font-heading text-2xl md:text-3xl font-semibold flex items-center gap-2 text-foreground">
          <VIcon name="bi-gem" class="size-7 text-primary" aria-hidden="true" />
          {{ t("home.more.title") }}
        </h2>
        <p class="mt-3 text-muted-foreground max-w-2xl font-heading leading-relaxed">
          {{ t("home.more.body") }}
        </p>
        <ul class="mt-6 space-y-4 max-w-2xl">
          <li class="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <span class="mt-0.5 shrink-0 text-primary" aria-hidden="true">
              <VIcon name="bi-plus-circle" class="size-5" />
            </span>
            <span class="text-muted-foreground leading-relaxed font-heading">{{ t("home.more.bullet1") }}</span>
          </li>
          <li class="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <span class="mt-0.5 shrink-0 text-primary" aria-hidden="true">
              <VIcon name="bi-plus-circle" class="size-5" />
            </span>
            <span class="text-muted-foreground leading-relaxed font-heading">{{ t("home.more.bullet2") }}</span>
          </li>
        </ul>
        </div>
      </section>

      <section id="communication" class="w-full py-20 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto">
        <h2 class="font-heading text-2xl md:text-3xl font-semibold flex items-center gap-2 text-foreground">
          <VIcon name="bi-chat-dots" class="size-7 text-primary" aria-hidden="true" />
          {{ t("home.communication.title") }}
        </h2>
        <p class="mt-3 text-muted-foreground mb-6 max-w-2xl font-heading leading-relaxed">
          {{ t("home.communication.lead") }}
        </p>
        <form
          v-if="!submitted"
          class="max-w-md space-y-4"
          @submit.prevent="submitContact"
        >
          <input type="text" name="_honey" hidden >
          <div>
            <UiLabel for="contact-email" class="flex items-center gap-2 mb-1.5">
              <VIcon name="bi-envelope" class="size-4 text-muted-foreground" aria-hidden="true" />
              {{ t("home.communication.emailLabel") }}
            </UiLabel>
            <UiInput
              id="contact-email"
              v-model="email"
              type="email"
              required
              class="rounded-xl"
            />
          </div>
          <div>
            <UiLabel for="contact-message" class="flex items-center gap-2 mb-1.5">
              <VIcon name="bi-chat-text" class="size-4 text-muted-foreground" aria-hidden="true" />
              {{ t("home.communication.messageLabel") }}
            </UiLabel>
            <UiTextarea id="contact-message" v-model="message" :rows="4" required />
          </div>
          <UiButton type="submit" class="rounded-xl w-full" :disabled="submitting">
            {{ submitting ? t("home.communication.sending") : t("home.communication.submit") }}
          </UiButton>
          <p class="text-sm text-muted-foreground">
            {{ t("home.communication.note") }}
          </p>
        </form>
        <div v-else class="max-w-md rounded-xl border border-border bg-card p-6 text-center">
          <VIcon name="bi-check2-circle" class="size-10 mx-auto text-primary" aria-hidden="true" />
          <p class="mt-3 font-heading text-foreground">
            {{ t("home.communication.successMessage") }}
          </p>
        </div>
        </div>
      </section>
      <LayoutAppFooter />
    </div>
  </div>
</template>
