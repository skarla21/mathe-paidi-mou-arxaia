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

/**
 * Parse the Accept-Language header and return the best supported locale.
 * Returns "en" only when the highest-weighted English tag outranks Greek.
 * Falls back to "el" for any absent, malformed, or unrecognised value.
 */
function detectLocaleFromHeader(header: string): Locale {
  // Each entry looks like: "en-US,en;q=0.9,el;q=0.8,fr;q=0.7"
  const entries = header
    .split(",")
    .map((raw) => {
      const [tag, qPart] = raw.trim().split(";q=");
      const q = qPart !== undefined ? parseFloat(qPart) : 1;
      const lang = (tag ?? "").trim().split("-")[0]?.toLowerCase() ?? "";
      return { lang, q: Number.isFinite(q) ? q : 1 };
    })
    .filter((e) => e.lang === "en" || e.lang === "el")
    .sort((a, b) => b.q - a.q);

  return entries[0]?.lang === "en" ? "en" : "el";
}

export function useI18n() {
  const localeCookie = useCookie<Locale>("locale", {
    // No built-in default — we compute the initial value below so that
    // first-time visitors get Accept-Language detection instead of always "el".
    sameSite: "lax",
  });

  const currentLocale = useState<Locale>("i18n-locale", () => {
    // 1. Returning visitor: honour the saved cookie.
    if (localeCookie.value) return localeCookie.value;

    // 2. First-time visitor on the server: read Accept-Language.
    if (!import.meta.client) {
      const headers = useRequestHeaders(["accept-language"]);
      const header = headers["accept-language"];
      if (header) {
        const detected = detectLocaleFromHeader(header);
        // Persist so the same locale is used across the full SSR render and
        // the cookie is sent to the browser for subsequent requests.
        localeCookie.value = detected;
        return detected;
      }
    }

    // 3. Fallback: Greek (project default).
    localeCookie.value = "el";
    return "el";
  });

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
