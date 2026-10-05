<script setup lang="ts">
const { openRegister } = useAuthModal();
const hoveredKey = ref<string | null>(null);
const finePointer = ref(true);

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function backHidden(key: string) {
  return finePointer.value && hoveredKey.value !== key;
}

onMounted(() => {
  finePointer.value = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
});

const tiers = [
  {
    key: "guest",
    icon: "bi-unlock",
    accent: "text-laurel",
    badge: "bg-laurel-fixed text-laurel-fixed-foreground",
    back: "bg-gradient-to-br from-[#006e2d] to-[#004e1e]",
    ctaClass: "bg-white text-laurel",
    recommended: false,
    badgeText: "Χωρίς λογαριασμό",
    title: "Περιήγηση",
    lead: "Βλέπεις τάξεις, κεφάλαια, κατηγορίες, άρθρα και τους τίτλους των μαθημάτων.",
    bullets: [
      "Πλοήγηση σε όλη την ύλη",
      "Ανάγνωση δημοσιευμένων άρθρων",
      "Οι τίτλοι των μαθημάτων μένουν ορατοί",
    ],
    backTitle: "Ξεκίνα από τις τάξεις",
    backLead:
      "Τα PDF ανοίγουν με επιβεβαιωμένο λογαριασμό, και μόνο αν το μάθημα είναι δωρεάν ή αγορασμένο.",
    cta: "Δες τις τάξεις",
    note: "Χωρίς εγγραφή για την περιήγηση",
    action: () => scrollTo("grades"),
  },
  {
    key: "account",
    icon: "bi-person-plus",
    accent: "text-primary",
    badge: "bg-flame-fixed text-flame-fixed-foreground",
    back: "bg-gradient-to-br from-[#ea580c] via-[#cc4900] to-[#a33900]",
    ctaClass: "bg-white text-primary",
    recommended: true,
    badgeText: "Δωρεάν εγγραφή",
    title: "Με λογαριασμό",
    lead: "Επιβεβαιώνεις το email, ανοίγεις τα δωρεάν PDF και αγοράζεις ό,τι είναι επί πληρωμή.",
    bullets: [
      "Άνοιγμα δωρεάν αρχείων μετά την επιβεβαίωση",
      "Αγορά μαθήματος μέσω Stripe",
      "Οι αγορές σου στο υλικό μου, σχόλια στα άρθρα",
    ],
    backTitle: "Δικός σου χώρος",
    backLead:
      "Ο λογαριασμός είναι δωρεάν. Πληρώνεις μόνο τα μαθήματα που έχουν τιμή.",
    cta: "Δημιουργία λογαριασμού",
    note: "Η επιβεβαίωση email ξεκλειδώνει τα αρχεία",
    action: () => openRegister(),
  },
  {
    key: "tutor",
    icon: "bi-star",
    accent: "text-amethyst",
    badge: "bg-amethyst-fixed text-amethyst-fixed-foreground",
    back: "bg-gradient-to-br from-[#6b38d4] via-[#5516be] to-[#3a0e88]",
    ctaClass: "bg-white text-amethyst",
    recommended: false,
    badgeText: "Ιδιαίτερα",
    title: "Ιδιαίτερα μαθήματα",
    lead: "Ζήτησε προσωπική προετοιμασία. Δεν υπάρχει πληρωμή ιδιαίτερων μέσα από την εφαρμογή.",
    bullets: [
      "Πες την τάξη και το μάθημα που σε νοιάζει",
      "Η φιλόλογος απαντά στο μήνυμα",
      "Συνεννόηση για online συνεδρίες",
    ],
    backTitle: "Στείλε μήνυμα",
    backLead:
      "Η φόρμα επικοινωνίας είναι ο τρόπος να ζητήσεις ιδιαίτερα ή να ρωτήσεις για το υλικό.",
    cta: "Πήγαινε στη φόρμα",
    note: "Απάντηση το συντομότερο",
    action: () => scrollTo("communication"),
  },
];
</script>

<template>
  <section id="instructions" class="scroll-mt-24 py-16">
    <div class="relative overflow-hidden rounded-3xl bg-secondary p-8 lg:p-12">
      <div class="mx-auto mb-12 max-w-2xl space-y-3 text-center">
        <span
          class="inline-flex rounded-full bg-flame-fixed px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-flame-fixed-foreground"
        >
          Οδηγίες και πρόσβαση
        </span>
        <h2
          class="font-heading text-3xl font-extrabold text-foreground sm:text-4xl"
        >
          Πώς λειτουργεί το «Μάθε Παιδί μου Αρχαία»
        </h2>
        <p class="text-muted-foreground">
          Τι μπορείς να δεις χωρίς λογαριασμό, τι ξεκλειδώνει η δωρεάν εγγραφή
          και πώς ζητάς ιδιαίτερα.
        </p>
      </div>
      <div id="guide-grid" class="grid gap-6 md:grid-cols-3">
        <article
          v-for="tier in tiers"
          :key="tier.key"
          class="slide-deck h-116 rounded-2xl border border-border bg-card shadow-sm"
          @mouseenter="hoveredKey = tier.key"
          @mouseleave="hoveredKey = hoveredKey === tier.key ? null : hoveredKey"
        >
          <div
            class="deck-front flex h-full flex-col justify-between bg-card p-6"
          >
            <div>
              <div
                v-if="tier.recommended"
                class="mx-auto mb-3 w-fit -translate-y-1 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold uppercase text-primary-foreground"
              >
                Προτεινόμενο
              </div>
              <div class="mb-4 flex items-center justify-between">
                <VIcon
                  :name="tier.icon"
                  class="size-8"
                  :class="tier.accent"
                  aria-hidden="true"
                />
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  :class="tier.badge"
                >
                  {{ tier.badgeText }}
                </span>
              </div>
              <h3 class="mb-2 font-heading text-xl font-bold">
                {{ tier.title }}
              </h3>
              <p class="mb-6 text-sm text-muted-foreground">{{ tier.lead }}</p>
              <ul class="space-y-3 text-sm">
                <li
                  v-for="item in tier.bullets"
                  :key="item"
                  class="flex items-center gap-2"
                >
                  <VIcon
                    name="bi-check2-circle"
                    class="size-4 shrink-0"
                    :class="tier.accent"
                    aria-hidden="true"
                  />
                  {{ item }}
                </li>
              </ul>
              <p
                class="slide-deck-hint mt-4 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Πέρασε το ποντίκι
              </p>
            </div>
            <button
              type="button"
              class="relative z-10 mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-xl py-3 text-sm font-bold"
              :class="tier.ctaClass"
              @click="tier.action()"
            >
              {{ tier.cta }}
            </button>
          </div>
          <div
            class="deck-back absolute inset-0 flex h-full flex-col justify-between rounded-2xl p-7 text-white"
            :class="tier.back"
            :inert="backHidden(tier.key) || undefined"
            :aria-hidden="backHidden(tier.key) ? 'true' : undefined"
          >
            <div class="space-y-3">
              <div
                class="flex size-12 items-center justify-center rounded-xl bg-white/20"
              >
                <VIcon :name="tier.icon" class="size-6" aria-hidden="true" />
              </div>
              <h3 class="font-heading text-2xl font-extrabold">
                {{ tier.backTitle }}
              </h3>
              <p class="text-sm leading-relaxed text-white/90">
                {{ tier.backLead }}
              </p>
            </div>
            <div class="space-y-2 pt-4">
              <button
                type="button"
                class="inline-flex w-full cursor-pointer items-center justify-center rounded-xl py-3.5 text-sm font-bold shadow-lg"
                :class="tier.ctaClass"
                @click="tier.action()"
              >
                {{ tier.cta }}
              </button>
              <span class="block text-center text-xs text-white/75">{{
                tier.note
              }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
