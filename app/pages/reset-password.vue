<script setup lang="ts">
import { toast } from "vue-sonner";
import UiButton from "~/components/ui/Button.vue";
import UiCard from "~/components/ui/Card.vue";
import UiCardContent from "~/components/ui/CardContent.vue";
import UiCardHeader from "~/components/ui/CardHeader.vue";
import UiLabel from "~/components/ui/Label.vue";
import UiPasswordInput from "~/components/ui/PasswordInput.vue";

const route = useRoute();
const { t } = useI18n();

useHead(() => ({
  title: t("auth.resetPassword.title"),
}));

const token = computed(() => (route.query.token as string) || "");
const newPassword = ref("");
const confirmPassword = ref("");
const loading = ref(false);

async function onSubmit() {
  if (newPassword.value.length < 6) {
    toast.error(t("auth.validation.passwordMin"));
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.error(t("profile.edit.passwordMismatch"));
    return;
  }
  if (!token.value) {
    toast.error(t("auth.resetPassword.invalidLink"));
    return;
  }

  loading.value = true;
  try {
    await $fetch("/api/auth/reset-password", {
      method: "POST",
      body: { token: token.value, newPassword: newPassword.value },
    });
    toast.success(t("auth.resetPassword.success"));
    await navigateTo("/login");
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string };
    toast.error(
      err?.data?.message ?? err?.message ?? t("auth.resetPassword.error"),
    );
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-full flex items-center justify-center p-4">
    <UiCard
      class="relative flex flex-col justify-center w-full max-w-sm overflow-hidden border-0 rounded-2xl shadow-[0_0_30px_-8px_rgba(0,0,0,0.12)] bg-transparent dark:bg-card/80 dark:backdrop-blur-md dark:border dark:border-border"
    >
      <div
        class="absolute inset-0 rounded-2xl bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: `url('/imgs/login_bg.jpg')`, opacity: 0.2 }"
        aria-hidden="true"
      />
      <div class="relative z-10 rounded-2xl max-w-sm mx-auto">
        <UiCardHeader class="space-y-1 pb-4">
          <h1 class="text-2xl font-bold font-heading">
            {{ t("auth.resetPassword.title") }}
          </h1>
          <p class="text-muted-foreground text-sm">
            {{ t("auth.resetPassword.subtitle") }}
          </p>
        </UiCardHeader>
        <UiCardContent class="space-y-4 pt-0">
          <form v-if="token" class="space-y-4" @submit.prevent="onSubmit">
            <div class="space-y-2">
              <UiLabel for="new-password">{{
                t("auth.resetPassword.newPassword")
              }}</UiLabel>
              <UiPasswordInput
                id="new-password"
                v-model="newPassword"
                :placeholder="t('auth.resetPassword.newPassword')"
                autocomplete="new-password"
              />
            </div>
            <div class="space-y-2">
              <UiLabel for="confirm-password">{{
                t("auth.resetPassword.confirmPassword")
              }}</UiLabel>
              <UiPasswordInput
                id="confirm-password"
                v-model="confirmPassword"
                :placeholder="t('auth.resetPassword.confirmPassword')"
                autocomplete="new-password"
              />
            </div>
            <UiButton type="submit" class="w-full" :disabled="loading">
              {{
                loading ? t("common.loading") : t("auth.resetPassword.submit")
              }}
            </UiButton>
          </form>
          <div
            v-else
            class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center"
          >
            <p class="text-sm text-destructive">
              {{ t("auth.resetPassword.invalidLink") }}
            </p>
            <NuxtLink
              to="/login"
              class="block mt-2 text-sm text-primary hover:underline"
            >
              {{ t("auth.back") }}
            </NuxtLink>
          </div>
          <NuxtLink
            to="/login"
            class="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
          >
            <VIcon
              name="bi-arrow-right"
              class="size-4 rotate-180"
              aria-hidden="true"
            />
            {{ t("auth.back") }}
          </NuxtLink>
        </UiCardContent>
      </div>
    </UiCard>
  </div>
</template>
