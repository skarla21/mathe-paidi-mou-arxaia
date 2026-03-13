// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  srcDir: "app",
  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&family=Noto+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Serif+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Titan+One&display=swap",
        },
      ],
    },
  },
  css: [resolve(__dirname, "app/assets/css/main.css")],
  modules: ['@nuxt/eslint'],
  vite: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [tailwindcss()] as any,
  },
  nitro: {
    experimental: {
      openAPI: false,
    },
  },
  alias: {
    cookie: resolve(__dirname, "node_modules/cookie"),
  },
  runtimeConfig: {
    public: {
      supabaseUrl: "",
      supabaseAnonKey: "",
    },
    supabaseServiceKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    authSecret: "",
    googleClientId: "",
    googleClientSecret: "",
  },
});
