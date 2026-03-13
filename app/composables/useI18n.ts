import el from "~/locales/el.json";
import en from "~/locales/en.json";

type Locale = "el" | "en";

type Messages = Record<string, unknown>;

const messages: Record<Locale, Messages> = {
  el: el as Messages,
  en: en as Messages,
};

function getNested(obj: Messages, path: string): string | undefined {
  const value = path
    .split(".")
    .reduce((o: unknown, k) => (o as Messages)?.[k], obj);
  return typeof value === "string" ? value : undefined;
}

export function useI18n() {
  const localeCookie = useCookie<Locale>("locale", {
    default: () => "el",
    sameSite: "lax",
  });

  const currentLocale = useState<Locale>(
    "i18n-locale",
    () => localeCookie.value ?? "el",
  );

  function t(key: string, params?: Record<string, string | number>): string {
    let out = getNested(messages[currentLocale.value], key) ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return out;
  }

  function setLocale(locale: Locale) {
    currentLocale.value = locale;
    localeCookie.value = locale;
  }

  function init() {
    // No-op: locale is initialized from cookie via useState default.
    // Kept for API compatibility with existing callers.
  }

  return { t, locale: readonly(currentLocale), setLocale, init };
}
