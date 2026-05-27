<template>
  <div
    id="main-content"
    :class="locale === 'ar' ? 'bodyAR' : 'bodyEN'"
  >
    <SharedNavbar />
    <div class="navbar-spacer" />
    <SharedAdsBanner />
    <slot />
    <SharedPwaInstallNotice />
    <ClientOnly>
      <SharedUiNavigationMobileBottomBar :items="bottomNavItems" />
    </ClientOnly>
    <LazySharedFooter hydrate-on-idle />
  </div>
</template>

<script setup>
const { locale, t } = useI18n();

const bottomNavItems = computed(() => [
  { key: "home",      label: "nav.home",      icon: "mdi:home-outline",         to: "/" },
  { key: "standings", label: "nav.standings",  icon: "mdi:table",                to: "/standings" },
  { key: "fixtures",  label: "nav.fixtures",   icon: "mdi:calendar-outline",     to: "/fixtures" },
  { key: "bracket",   label: "nav.bracket",    icon: "mdi:trophy-outline",       to: "/bracket" },
  { key: "teams",     label: "nav.teams",      icon: "mdi:shield-outline",       to: "/teams" },
  { key: "stats",     label: "nav.stats",      icon: "mdi:chart-bar",            to: "/stats" },
]);

useSeoMeta({
  title: () => locale.value === "ar" ? "دوري القرية السنوي" : "Village League",
  ogTitle: () => locale.value === "ar" ? "دوري القرية السنوي" : "Village League",
  description: () =>
    locale.value === "ar"
      ? "تابع نتائج وترتيب وتفاصيل دوري كرة القدم السنوي"
      : "Follow results, standings and match details of the annual football league",
  ogType: "website",
  ogLocale: () => locale.value === "ar" ? "ar_SA" : "en_US",
  ogImage: "/logo/logo-web.png",
  twitterCard: "summary_large_image",
});
</script>

<style lang="scss" scoped>
#main-content {
  overflow-x: hidden;
  min-height: 100dvh;
  background: var(--bg-page);
}

.navbar-spacer {
  height: var(--header-height);

  @media (max-width: 991.98px) {
    height: var(--header-height-mobile);
  }
}
</style>
