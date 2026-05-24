export default defineNuxtConfig({
  devtools: { enabled: false },

  modules: [
    "@nuxt/content",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/fonts",
    "@nuxtjs/i18n",
    "@nuxtjs/color-mode",
    "@vite-pwa/nuxt",
    "nuxt-beastcss",
    "nuxt-vitalizer",
  ],

  content: {
    studio: { enabled: true },
    highlight: { theme: "github-dark" },
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
    "/teams/**": { prerender: true },
    "/players/**": { prerender: true },
    "/matches/**": { prerender: true },
    "/studio/**": { ssr: false },
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
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: { name: "layout", mode: "out-in" },

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
      season: "2025",
    },
  },

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "دوري القرية",
      short_name: "الدوري",
      description: "نتائج دوري كرة القدم",
      theme_color: "#22c55e",
      background_color: "#0e0f0d",
      display: "standalone",
      lang: "ar",
      dir: "rtl",
      icons: [
        { src: "/logo/logo-web.png", sizes: "192x192", type: "image/png" },
        { src: "/logo/logo-web.png", sizes: "512x512", type: "image/png" },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,png,webp,svg,woff2}"],
      navigateFallback: "/",
      navigateFallbackDenylist: [/^\/studio\//],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\/api\/.*$/,
          handler: "NetworkFirst",
          options: { cacheName: "api-cache", expiration: { maxAgeSeconds: 60 * 60 * 2 } },
        },
      ],
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
  },

  compatibilityDate: "2025-12-29",
});
