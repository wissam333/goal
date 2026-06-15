<template>
  <div>
    <VitePwaManifest />
    <ElementsLoader></ElementsLoader>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <SharedUiFeedbackToast position="center" :duration="6000" />
    </ClientOnly>
    <SharedPwaInstallNotice />
  </div>
</template>

<script setup>
const { locale } = useI18n();
const theme = useTheme();
theme.init();

const { name: appName } = useAppTitle();

useHead({
  htmlAttrs: {
    lang: computed(() => locale.value),
    dir: computed(() => (locale.value === "ar" ? "rtl" : "ltr")),
  },
  link: [{ rel: "apple-touch-icon", href: "/logo.png" }],
});

useSeoMeta({
  ogSiteName: computed(() => appName.value || "دوري القرية السنوي"),
  twitterCard: "summary_large_image",
  ogImage: "/logo/logo.png",
});
</script>
