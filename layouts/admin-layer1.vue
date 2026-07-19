<template>
  <div :class="locale === 'ar' ? 'bodyAR' : 'bodyEN'" class="admin-layout">
    <header class="admin-topbar">
      <div class="topbar-inner container">
        <NuxtLink to="/admin" class="topbar-brand">
          <img src="/logo.png" alt="Green Ball" class="brand-logo" />
          <span class="brand-title">Green Ball</span>
        </NuxtLink>
        <nav class="topbar-links">
          <NuxtLink to="/admin" class="topbar-link" :class="{ active: route.path === '/admin' }">
            <Icon name="mdi:format-list-group" size="16" />
            <span>الدوريات</span>
          </NuxtLink>
          <NuxtLink to="/admin/users" class="topbar-link" :class="{ active: route.path === '/admin/users' }">
            <Icon name="mdi:account-group-outline" size="16" />
            <span>المستخدمون</span>
          </NuxtLink>
        </nav>
        <div class="topbar-spacer" />
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

    <ClientOnly>
      <NotificationsPushPrompt />
    </ClientOnly>

    <main class="admin-main">
      <div class="container">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
const locale = useI18n().locale
const theme = useTheme()
const auth = useAdminAuth()

const route = useRoute()
onMounted(async () => {
  if (!await auth.checkSession() && route.path !== '/admin/login') {
    navigateTo('/admin/login')
  }
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
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}
.brand-logo {
  width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
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
.topbar-spacer { flex: 1; }
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
.admin-main {
  padding-top: 56px;
  padding-bottom: 72px;
  .container { padding-top: 20px; }
}
</style>
