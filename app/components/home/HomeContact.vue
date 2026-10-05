<script setup lang="ts">
import { toast } from "vue-sonner";

const { t } = useI18n();
const { grades, ensure } = useCatalogNav();

const name = ref("");
const email = ref("");
const phone = ref("");
const gradeId = ref("");
const message = ref("");
const honey = ref("");
const submitting = ref(false);
const submitted = ref(false);

await ensure();

async function submitContact() {
  if (honey.value) {
    submitted.value = true;
    return;
  }
  submitting.value = true;
  try {
    await $fetch("/api/contact", {
      method: "POST",
      body: {
        email: email.value,
        message: message.value,
        name: name.value,
        phone: phone.value,
        gradeId: gradeId.value,
        honey: honey.value,
      },
    });
    toast.success(t("home.communication.successToast"));
    submitted.value = true;
  } catch {
    toast.error(t("home.communication.errorToast"));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section id="communication" class="scroll-mt-24 py-16">
    <div class="grid items-start gap-8 lg:grid-cols-12">
      <div class="space-y-6 lg:col-span-5">
        <div
          class="inline-flex items-center gap-2 rounded-full bg-flame-fixed px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-flame-fixed-foreground"
        >
          <VIcon name="bi-chat-dots" class="size-4" aria-hidden="true" />
          {{ t("home.contact.eyebrow") }}
        </div>
        <h2
          class="font-heading text-3xl font-extrabold text-foreground sm:text-4xl"
        >
          {{ t("home.contact.title") }}
        </h2>
        <p class="text-muted-foreground">{{ t("home.contact.lead") }}</p>
        <div class="space-y-4">
          <div
            class="flex items-center gap-3.5 rounded-2xl bg-card p-4 shadow-sm"
          >
            <span
              class="flex size-10 items-center justify-center rounded-full bg-laurel-fixed text-laurel-fixed-foreground"
            >
              <VIcon name="bi-envelope" class="size-5" aria-hidden="true" />
            </span>
            <div>
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >{{ t("home.contact.emailCaption") }}</span
              >
              <span class="font-semibold">{{
                t("home.contact.emailValue")
              }}</span>
            </div>
          </div>
          <div
            class="flex items-center gap-3.5 rounded-2xl bg-card p-4 shadow-sm"
          >
            <span
              class="flex size-10 items-center justify-center rounded-full bg-flame-fixed text-flame-fixed-foreground"
            >
              <VIcon
                name="bi-clock-history"
                class="size-5"
                aria-hidden="true"
              />
            </span>
            <div>
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >{{ t("home.contact.sessionsCaption") }}</span
              >
              <span class="font-semibold">{{
                t("home.contact.sessionsValue")
              }}</span>
            </div>
          </div>
          <div
            class="flex items-center gap-3.5 rounded-2xl bg-card p-4 shadow-sm"
          >
            <span
              class="flex size-10 items-center justify-center rounded-full bg-amethyst-fixed text-amethyst-fixed-foreground"
            >
              <VIcon name="bi-mortarboard" class="size-5" aria-hidden="true" />
            </span>
            <div>
              <span
                class="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >{{ t("home.contact.focusCaption") }}</span
              >
              <span class="font-semibold">{{
                t("home.contact.focusValue")
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-3xl border border-border bg-card p-8 shadow-[0_16px_36px_rgba(0,0,0,0.06)] lg:col-span-7"
      >
        <h3 class="font-heading text-xl font-bold">
          {{ t("home.contact.formTitle") }}
        </h3>
        <p class="mb-6 text-sm text-muted-foreground">
          {{ t("home.contact.formLead") }}
        </p>
        <p
          v-if="submitted"
          class="rounded-2xl bg-laurel-fixed/60 p-4 text-sm font-medium text-laurel-fixed-foreground"
        >
          {{ t("home.communication.successMessage") }}
        </p>
        <form v-else class="space-y-4" @submit.prevent="submitContact">
          <input
            v-model="honey"
            type="text"
            name="_honey"
            class="hidden"
            tabindex="-1"
            autocomplete="off"
          >
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-1.5 text-sm font-semibold">
              {{ t("home.contact.nameLabel") }}
              <input
                v-model="name"
                type="text"
                maxlength="120"
                class="h-12 w-full rounded-xl border-none bg-secondary px-4 font-normal focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                :placeholder="t('home.contact.namePlaceholder')"
              >
            </label>
            <label class="space-y-1.5 text-sm font-semibold">
              {{ t("home.communication.emailLabel") }}
              <input
                v-model="email"
                type="email"
                required
                class="h-12 w-full rounded-xl border-none bg-secondary px-4 font-normal focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                :placeholder="t('home.communication.emailPlaceholder')"
              >
            </label>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-1.5 text-sm font-semibold">
              {{ t("home.contact.gradeLabel") }}
              <select
                v-model="gradeId"
                class="h-12 w-full rounded-xl border-none bg-secondary px-4 font-normal focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">
                  {{ t("home.contact.gradePlaceholder") }}
                </option>
                <option
                  v-for="grade in grades"
                  :key="grade.id"
                  :value="grade.id"
                >
                  {{ grade.name }}
                </option>
              </select>
            </label>
            <label class="space-y-1.5 text-sm font-semibold">
              {{ t("home.contact.phoneLabel") }}
              <input
                v-model="phone"
                type="tel"
                maxlength="40"
                class="h-12 w-full rounded-xl border-none bg-secondary px-4 font-normal focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                :placeholder="t('home.contact.phonePlaceholder')"
              >
            </label>
          </div>
          <label class="block space-y-1.5 text-sm font-semibold">
            {{ t("home.communication.messageLabel") }}
            <textarea
              v-model="message"
              required
              maxlength="4000"
              rows="4"
              class="w-full rounded-xl border-none bg-secondary p-4 font-normal focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              :placeholder="t('home.contact.messagePlaceholder')"
            />
          </label>
          <button
            type="submit"
            class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-orange-600 to-amber-500 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(234,88,12,0.35)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
            :disabled="submitting"
          >
            <VIcon name="bi-send" class="size-4" aria-hidden="true" />
            {{
              submitting
                ? t("home.communication.sending")
                : t("home.communication.submit")
            }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>
