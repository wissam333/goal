export default defineNuxtConfig({
  devtools: { enabled: false },

  modules: [
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/fonts",
    "@nuxtjs/i18n",
  ],

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
    langDir: "./locales/",
    defaultLocale: "ar",
    lazy: false,
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
    head: {
      title: "دوري كرة القدم السنوي",
      htmlAttrs: { lang: "ar" },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "متابع نتائج وجدول دوري كرة القدم السنوي للقرية" },
        { name: "theme-color", media: "(prefers-color-scheme: light)", content: "#22c55e" },
        { name: "theme-color", media: "(prefers-color-scheme: dark)", content: "#0f1117" },
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
      script: [
        {
          innerHTML: `(function(){var d=document.documentElement;var m=localStorage.getItem('league-dark-mode');if(m==='true'||(m===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){d.classList.add('dark')}var p=localStorage.getItem('league-primary-color');if(p){var r=parseInt(p.slice(1,3),16),g=parseInt(p.slice(3,5),16),b=parseInt(p.slice(5,7),16);d.style.setProperty('--primary',p);d.style.setProperty('--primary-soft','rgba('+r+','+g+','+b+',0.1)');d.style.setProperty('--primary-mid','rgba('+r+','+g+','+b+',0.2)')}})()`,
          tagPosition: "head",
          type: "text/javascript",
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
    server: {
      warmup: {
        clientFiles: [
          './pages/**/*.vue',
          './components/**/*.vue',
          './layouts/**/*.vue',
        ],
      },
    },
    optimizeDeps: {
      include: [
        'date-fns',
        'date-fns/locale',
        '@fancyapps/ui',
      ],
    },
  },

  nitro: {
    preset: "cloudflare_pages",
    compressPublicAssets: true,
    minify: true,
    prerender: {
      failOnError: false,
    },
  },

  compatibilityDate: "2025-12-29",

  experimental: {
    // appManifest: false — removed to fix _payload.json 500 in dev
  },
})
