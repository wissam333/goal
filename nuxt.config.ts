export default defineNuxtConfig({
  devtools: { enabled: false },

  modules: [
    "@nuxt/content",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/fonts",
    "@nuxtjs/i18n",
    "@nuxtjs/color-mode",
    "nuxt-beastcss",
    "nuxt-vitalizer",
    "nuxt-studio",
  ],

  content: {
    highlight: { theme: "github-dark" },
  },

  studio: {
    route: "/_studio",
    repository: {
      provider: "github",
      owner: "wissam333",
      repo: "goal",
      branch: "main",
    },
  },

  colorMode: {
    classSuffix: "",
    preference: "dark",
    fallback: "dark",
    storageKey: "league-color-mode",
  },

  vitalizer: {
    disableStylesheets: "entry",
    disablePrefetchLinks: true,
    disablePreloadLinks: true,
  },

  beastcss: {
    config: {
      pruneSource: true,
      additionalStylesheets: [],
      asyncLoad: true,
    },
  },

  fonts: {
    defaults: { preload: true, display: "swap" },
  },

  routeRules: {
    "/": { prerender: true },
    "/standings": { prerender: true },
    "/fixtures": { prerender: true },
    "/bracket": { prerender: true },
    "/stats": { prerender: true },
  },

  i18n: {
    strategy: "no_prefix",
    langDir: "locales/",
    defaultLocale: "ar",
    lazy: true,
    locales: [
      { code: "ar", iso: "ar-SA", name: "العربية", file: "ar.json", dir: "rtl" },
      { code: "en", iso: "en-US", name: "English", file: "en.json", dir: "ltr" },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
    bundle: { optimizeTranslationDirective: false },
  },

  css: ["@/assets/scss/main.scss"],

  image: {
    provider: "ipx",
    format: ["webp"],
    quality: 80,
    screens: { xs: 320, sm: 640, md: 768, lg: 1024, xl: 1280 },
    densities: [1, 2],
  },

  app: {
    pageTransition: { name: "page" },
    head: {
      title: "دوري كرة القدم السنوي",
      htmlAttrs: { lang: "ar" },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "متابع نتائج وجدول دوري كرة القدم السنوي للقرية" },
        { name: "theme-color", content: "#22c55e" },
      ],
      link: [
        { rel: "icon", href: "/logo/logo-web.png", type: "image/png" },
        {
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
          media: "print",
          onload: "this.media='all'",
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseKey: process.env.SUPABASE_ANON_KEY || "",
      leagueName: "دوري القرية السنوي",
      season: "2026",
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/theme/variables.scss" as *;',
        },
      },
    },
  },

  nitro: {
    compressPublicAssets: true,
    minify: true,
    prerender: {
      failOnError: false,
    },
  },

  compatibilityDate: "2025-12-29",

  experimental: {
    appManifest: false,
  },
});
