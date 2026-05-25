<template>
  <div>
    <ElementsLoader></ElementsLoader>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <SharedUiFeedbackToast position="center" :duration="6000" />
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
});

useSeoMeta({
  ogSiteName: "دوري القرية السنوي",
  twitterCard: "summary_large_image",
  ogImage: "/logo/logo-web.png",
});
</script>
