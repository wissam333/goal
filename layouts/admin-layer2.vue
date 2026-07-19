<template>
  <div :class="locale === 'ar' ? 'bodyAR' : 'bodyEN'" class="admin-layout">
    <header class="admin-topbar">
      <div class="topbar-inner container">
        <NuxtLink to="/admin" class="topbar-back-link" title="العودة للدوريات">
          <Icon name="mdi:chevron-right" size="22" />
        </NuxtLink>
        <NuxtLink to="/admin" class="topbar-brand">
          <img v-if="leagueLogo" :src="leagueLogo" alt="" class="brand-logo" />
          <span v-else class="brand-badge">{{ leagueName?.charAt(0) || 'D' }}</span>
          <span class="brand-title">{{ leagueName }}</span>
        </NuxtLink>
        <nav class="topbar-links">
          <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to" class="topbar-link" :class="{ active: route.path === link.to }">
            <Icon :name="link.icon" size="16" />
            <span>{{ link.label }}</span>
          </NuxtLink>
        </nav>
        <div class="topbar-actions">
          <button class="topbar-btn" @click="theme.toggleMode()" :title="theme.isDark.value ? 'وضع النهار' : 'وضع الليل'">
            <Icon :name="theme.isDark.value ? 'mdi:white-balance-sunny' : 'mdi:moon-waning-crescent'" size="18" />
          </button>
          <NuxtLink to="/" class="topbar-btn" title="العودة للموقع">
            <Icon name="mdi:arrow-left" size="18" />
          </NuxtLink>
          <button class="topbar-btn logout-btn" @click="auth.logout()" title="تسجيل الخروج">
            <Icon name="mdi:logout" size="18" />
          </button>
        </div>
      </div>
    </header>

    <nav class="admin-mobile-nav">
      <NuxtLink to="/admin" class="mobile-nav-item">
        <Icon name="mdi:chevron-right" size="20" />
        <span>العودة</span>
      </NuxtLink>
      <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to" class="mobile-nav-item" :class="{ active: route.path === link.to }">
        <Icon :name="link.icon" size="20" />
        <span>{{ link.label }}</span>
      </NuxtLink>
    </nav>

    <ClientOnly>
      <NotificationsPushPrompt />
    </ClientOnly>

    <main class="admin-main">
      <div class="container">
        <slot />
      </div>
    </main>

    <footer v-if="leagueLocation" class="admin-footer">
      <div class="container">
        <span class="footer-location">
          <Icon name="mdi:map-marker" size="14" />
          {{ leagueLocation }}
        </span>
      </div>
    </footer>
  </div>
</template>

<script setup>
const locale = useI18n().locale
const route = useRoute()
const theme = useTheme()
const auth = useAdminAuth()
const { league: leagueData } = useCurrentLeague()

const leagueSlug = computed(() => route.params.league)
const leagueName = computed(() => leagueData.value?.name || leagueSlug.value || 'لوحة التحكم')
const leagueLogo = computed(() => leagueData.value?.logo || null)
const leagueLocation = computed(() => leagueData.value?.location || null)

onMounted(async () => {
  if (!await auth.checkSession() && route.path !== '/admin/login') {
    navigateTo('/admin/login')
  }
})

const navLinks = computed(() => {
  const base = `/admin/${leagueSlug.value}`
  return [
    { to: `${base}/teams`, icon: 'mdi:shield-outline', label: 'الفرق' },
    { to: `${base}/matches`, icon: 'mdi:calendar-outline', label: 'المباريات' },
    { to: `${base}/seasons`, icon: 'mdi:trophy-outline', label: 'المواسم' },
    { to: `${base}/settings`, icon: 'mdi:cog-outline', label: 'الإعدادات' },
  ]
})
</script>

<style lang="scss" scoped>
.admin-layout {
  min-height: 100dvh;
  background: var(--bg-page);
}
.admin-topbar {
  position: fixed;
  top: 0; inset-inline: 0;
  z-index: 800;
  height: 56px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
}
.topbar-inner {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 16px;
}
.topbar-back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  border-radius: 8px;
  color: var(--text-muted);
  text-decoration: none;
  flex-shrink: 0;
  transition: all 0.15s;
  &:hover { background: var(--primary-soft); color: var(--primary); }
}
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}
.brand-badge {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: var(--primary);
  color: #fff;
  font-weight: 800;
  font-size: 0.9rem;
  border-radius: 8px;
}
.brand-logo { width: 32px; height: 32px; object-fit: cover; border-radius: 6px; }
.brand-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  @media (max-width: 576px) { display: none; }
}
.topbar-links {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  @media (max-width: 768px) { display: none; }
}
.topbar-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
  &:hover { background: var(--primary-soft); color: var(--primary); }
  &.active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
}
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.topbar-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; border-radius: 8px;
  cursor: pointer; color: var(--text-muted);
  transition: all 0.15s;
  &:hover { background: var(--primary-soft); color: var(--primary); }
}
.logout-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
.admin-mobile-nav {
  position: fixed;
  bottom: 0; inset-inline: 0;
  z-index: 800;
  height: 56px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-color);
  display: none;
  align-items: center;
  justify-content: space-around;
  padding: 0 8px;
  @media (max-width: 768px) { display: flex; }
}
.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-muted);
  font-size: 0.65rem;
  transition: all 0.15s;
  white-space: nowrap;
  &.active { color: var(--primary); }
  span { font-size: 0.6rem; }
}
.admin-main {
  padding-top: 56px;
  padding-bottom: 72px;
  .container { padding-top: 20px; }
}
.admin-footer {
  border-top: 1px solid var(--border-color);
  background: var(--bg-surface);
  padding: 10px 0;
  .container { display: flex; align-items: center; justify-content: center; }
}
.footer-location {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.75rem; color: var(--text-muted);
  text-decoration: none;
  &:hover { color: var(--primary); }
}
</style>
