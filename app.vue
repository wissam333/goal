<template>
  <div>
    <ElementsLoader></ElementsLoader>
    <VitePwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <SharedUiFeedbackToast position="center" :duration="6000" />
    </ClientOnly>
    <ClientOnly>
      <SharedPwaInstallNotice />
    </ClientOnly>
  </div>
</template>

<script setup>
const { locale } = useI18n();
const theme = useTheme();
theme.init();

useHead({
  htmlAttrs: {
    lang: computed(() => locale.value),
    dir: computed(() => (locale.value === "ar" ? "rtl" : "ltr")),
  },
  link: [
    { rel: "apple-touch-icon", href: "/logo.png" },
  ],
});

useSeoMeta({
  ogSiteName: "دوري القرية السنوي",
  twitterCard: "summary_large_image",
  ogImage: "/logo/logo-web.png",
});
</script>
