<template>
  <div
    id="main-content"
    :class="locale === 'ar' ? 'bodyAR' : 'bodyEN'"
  >
    <SharedNavbar />
    <div class="navbar-spacer" />
    <ClientOnly>
      <NotificationsPushPrompt />
    </ClientOnly>
    <SharedAdsBanner />
    <slot />
    <ClientOnly>
      <SharedUiNavigationMobileBottomBar :items="bottomNavItems" />
    </ClientOnly>
    <LazySharedFooter hydrate-on-idle />
  </div>
</template>

<script setup>
const { locale, t } = useI18n();
const { name: appName } = useAppTitle();
const { isLeagueRoute, leaguePath } = useCurrentLeague();

const defaultTitle = computed(() =>
  locale.value === "ar" ? "دوري القرية السنوي" : "Village League"
)

const pageTitle = computed(() => appName.value || defaultTitle.value)

const bottomNavItems = computed(() => {
  const base = isLeagueRoute.value ? leaguePath().replace(/\/+$/, '') : ''
  return [
    { key: "home",      label: "nav.home",      icon: "mdi:home-outline",         to: base || "/" },
    { key: "standings", label: "nav.standings",  icon: "mdi:table",                to: `${base}/standings` },
    { key: "fixtures",  label: "nav.fixtures",   icon: "mdi:calendar-outline",     to: `${base}/fixtures` },
    { key: "bracket",   label: "nav.bracket",    icon: "mdi:trophy-outline",       to: `${base}/bracket` },
    { key: "teams",     label: "nav.teams",      icon: "mdi:shield-outline",       to: `${base}/teams` },
    { key: "stats",     label: "nav.stats",      icon: "mdi:chart-bar",            to: `${base}/stats` },
  ]
})

useSeoMeta({
  title: () => pageTitle.value,
  ogTitle: () => pageTitle.value,
  description: () =>
    locale.value === "ar"
      ? "تابع نتائج وترتيب وتفاصيل دوري كرة القدم السنوي"
      : "Follow results, standings and match details of the annual football league",
  ogType: "website",
  ogLocale: () => locale.value === "ar" ? "ar_SA" : "en_US",
  ogImage: "/logo.png",
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
