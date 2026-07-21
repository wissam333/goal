export default defineNuxtConfig({
  devtools: { enabled: false },
  ignore: ["**/.history/**", "**/node_modules/**"],
  components: {
    dirs: ["~/components"],
  },
  modules: [
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/fonts",
    "@nuxtjs/i18n",
    "@vite-pwa/nuxt",
  ],

  pwa: {
    registerType: "autoUpdate",
    includeAssets: ["logo.png", "favicon.svg", "notification-icon.png", "notification-badge.png"],
    manifest: {
      name: "Green Ball",
      short_name: "Green Ball",
      description: "متابع نتائج وجدول دوري كرة القدم",
      theme_color: "#22c55e",
      background_color: "#ffffff",
      display: "standalone",
      orientation: "portrait-primary",
      scope: "/",
      start_url: "/",
      lang: "ar",
      dir: "rtl",
      icons: [
        {
          src: "logo.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    client: {
      installPrompt: "pwa-install-dismissed", // string key used for localStorage
      periodicSyncForUpdates: 3600,
    },
    strategies: "injectManifest",
    srcDir: "sw",
    filename: "sw.js",
    injectManifest: {
      globPatterns: ["**/*.{js,css,svg,png,ico,woff2}"],
      rollupFormat: "iife",
      rollupOptions: {
        treeshake: false,
      },
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: "/",
      navigateFallbackAllowlist: [/^\/(?!api)/],
      type: "module",
    },
  },

  fonts: {
    defaults: { preload: true, display: "swap" },
  },

  routeRules: {
    "/account": { ssr: false },
  },

  i18n: {
    strategy: "no_prefix",
    langDir: "./locales/",
    defaultLocale: "ar",
    lazy: false,
    locales: [
      {
        code: "ar",
        iso: "ar-SA",
        name: "العربية",
        file: "ar.json",
        dir: "rtl",
      },
      {
        code: "en",
        iso: "en-US",
        name: "English",
        file: "en.json",
        dir: "ltr",
      },
    ],
    detectBrowserLanguage: false,
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
      title: "Green Ball",
      htmlAttrs: { lang: "ar" },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "متابع نتائج وجدول دوري كرة القدم",
        },
        {
          name: "theme-color",
          media: "(prefers-color-scheme: light)",
          content: "#22c55e",
        },
        {
          name: "theme-color",
          media: "(prefers-color-scheme: dark)",
          content: "#0f1117",
        },
      ],
      link: [
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "icon", href: "/logo.png", type: "image/png" },
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
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || "",
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || "",
    public: {
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseKey: process.env.SUPABASE_ANON_KEY || "",
      siteUrl:
        process.env.NUXT_PUBLIC_SITE_URL ||
        "https://goal.wissam-n-najjom.workers.dev",
      firebaseApiKey: process.env.FIREBASE_API_KEY || "",
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
      firebaseAppId: process.env.FIREBASE_APP_ID || "",
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
      firebaseVapidKey: process.env.FIREBASE_VAPID_KEY || "",
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
      allowedHosts: true,
    },
    optimizeDeps: {
      include: ["date-fns", "date-fns/locale", "@fancyapps/ui"],
    },
  },

  compatibilityDate: "2025-12-29",
});
