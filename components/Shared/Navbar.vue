<template>
  <header class="navbar" :class="{ scrolled: isScrolled }">
    <div class="navbar-inner container">
      <NuxtLink to="/" class="navbar-logo">
        <span class="brand-icon">
          <Icon name="game-icons:soccer-ball" size="24" />
        </span>
        <div class="brand-text">
          <span class="brand-name">{{ $t("leagueName") }}</span>
          <span class="brand-season">{{ config.public.season }}</span>
        </div>
      </NuxtLink>

      <!-- Desktop nav links -->
      <nav class="navbar-links" aria-label="main navigation">
        <NuxtLink
          v-for="item in navItems"
          :key="item.key"
          :to="item.to"
          class="nav-link"
          :class="{
            active:
              route.path === item.to ||
              (item.to !== '/' && route.path.startsWith(item.to)),
          }"
        >
          <Icon :name="item.icon" size="16" aria-hidden="true" />
          <span>{{ $t(item.label) }}</span>
        </NuxtLink>
      </nav>

      <!-- Right controls -->
      <div class="navbar-controls">
        <ClientOnly>
          <NotificationsNotificationBell />
        </ClientOnly>

        <!-- Dark/light toggle (hidden on mobile, inside dropdown) -->
        <button
          class="ctrl-btn theme-btn"
          :aria-label="theme.isDark.value ? $t('lightMode') : $t('darkMode')"
          @click="theme.toggleMode()"
        >
          <Icon
            :name="
              theme.isDark.value
                ? 'mdi:white-balance-sunny'
                : 'mdi:moon-waning-crescent'
            "
            size="18"
          />
        </button>

        <!-- Language toggle -->
        <button
          class="ctrl-btn lang-btn"
          :aria-label="
            locale === 'ar' ? 'Switch to English' : 'التبديل للعربية'
          "
          @click="toggleLang"
        >
          {{ locale === "ar" ? "EN" : "ع" }}
        </button>

        <!-- Mobile menu button (only shows links, not bottom nav) -->
        <button
          class="ctrl-btn mobile-menu-btn"
          :aria-label="$t('menu')"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        >
          <Icon :name="mobileOpen ? 'mdi:close' : 'mdi:menu'" size="20" />
        </button>
      </div>
    </div>

    <!-- Mobile dropdown menu -->
    <Transition name="mobile-nav">
      <div
        v-if="mobileOpen"
        class="mobile-nav-overlay"
        @click="mobileOpen = false"
      >
        <div class="mobile-nav" @click.stop>
          <NuxtLink
            v-for="item in navItems"
            :key="item.key"
            :to="item.to"
            class="mobile-nav-item"
            :class="{ active: route.path === item.to }"
            @click="mobileOpen = false"
          >
            <Icon :name="item.icon" size="18" aria-hidden="true" />
            <span>{{ $t(item.label) }}</span>
            <Icon
              :name="locale === 'ar' ? 'mdi:chevron-left' : 'mdi:chevron-right'"
              size="16"
              class="mobile-nav-arrow"
              aria-hidden="true"
            />
          </NuxtLink>

          <div class="mobile-nav-divider" />

          <button class="mobile-nav-item mobile-nav-btn" @click="theme.toggleMode(); mobileOpen = false">
            <Icon :name="theme.isDark.value ? 'mdi:white-balance-sunny' : 'mdi:moon-waning-crescent'" size="18" aria-hidden="true" />
            <span>{{ theme.isDark.value ? $t('lightMode') : $t('darkMode') }}</span>
          </button>

          <button class="mobile-nav-item mobile-nav-btn" @click="toggleLang(); mobileOpen = false">
            <Icon name="mdi:translate" size="18" aria-hidden="true" />
            <span>{{ locale === 'ar' ? 'English' : 'العربية' }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup>
const theme = useTheme();
const { locale, setLocale } = useI18n();
const route = useRoute();
const config = useRuntimeConfig();

const isScrolled = ref(false);
const mobileOpen = ref(false);

const navItems = [
  { key: "home", label: "nav.home", icon: "mdi:home-outline", to: "/" },
  {
    key: "standings",
    label: "nav.standings",
    icon: "mdi:table",
    to: "/standings",
  },
  {
    key: "fixtures",
    label: "nav.fixtures",
    icon: "mdi:calendar-outline",
    to: "/fixtures",
  },
  {
    key: "bracket",
    label: "nav.bracket",
    icon: "mdi:tournament",
    to: "/bracket",
  },
  {
    key: "teams",
    label: "nav.teams",
    icon: "mdi:shield-outline",
    to: "/teams",
  },
  { key: "stats", label: "nav.stats", icon: "mdi:chart-bar", to: "/stats" },
];

const toggleColorMode = () => {
  theme.toggleMode();
};

const toggleLang = () => {
  setLocale(locale.value === "ar" ? "en" : "ar");
};

// Close mobile nav on route change
watch(
  () => route.path,
  () => {
    mobileOpen.value = false;
  },
);

onMounted(() => {
  const onScroll = () => {
    isScrolled.value = window.scrollY > 10;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onUnmounted(() => window.removeEventListener("scroll", onScroll));
});
</script>

<style lang="scss" scoped>
.navbar {
  position: fixed;
  top: 0;
  inset-inline: 0;
  z-index: 800;
  height: 64px;
  background: transparent;
  transition:
    background 0.3s ease,
    box-shadow 0.3s ease;

  &.scrolled {
    background: color-mix(in srgb, var(--bg-surface) 88%, transparent);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 1px 0 var(--border-color);
  }

  @media (max-width: 991.98px) {
    height: 56px;
    background: color-mix(in srgb, var(--bg-surface) 92%, transparent);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 1px 0 var(--border-color);
  }
}

.navbar-inner {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 16px;
}

// ── Brand ─────────────────────────────────────────────────────────────────────
.navbar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;

  &:hover .brand-name {
    color: var(--primary);
  }
}

.brand-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 10px;
  flex-shrink: 0;

  @media (max-width: 991.98px) {
    width: 32px;
    height: 32px;
  }
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  transition: color 0.2s;
  white-space: nowrap;
}

.brand-season {
  font-size: 0.68rem;
  color: var(--primary);
  font-weight: 600;
}

// ── Desktop nav ───────────────────────────────────────────────────────────────
.navbar-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;

  @media (max-width: 991px) {
    display: none;
  }
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    background: var(--primary-soft);
    color: var(--primary);
  }

  &.active {
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 600;
  }
}

// ── Controls ──────────────────────────────────────────────────────────────────
.navbar-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.ctrl-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.15s;

  &:hover {
    background: var(--primary-soft);
    color: var(--primary);
  }

  @media (max-width: 991.98px) {
    width: var(--touch-target);
    height: var(--touch-target);
    border-radius: 12px;
  }
}

.lang-btn {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.theme-btn {
  @media (max-width: 991.98px) {
    display: none;
  }
}

.mobile-menu-btn {
  @media (min-width: 992px) {
    display: none;
  }
}

// ── Mobile dropdown ───────────────────────────────────────────────────────────
.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  top: 56px;
  z-index: 700;
  background: rgba(0, 0, 0, 0.3);
  @media (min-width: 992px) {
    display: none;
  }
}

.mobile-nav {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-sub);
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.15s;
  min-height: var(--touch-target);

  .mobile-nav-arrow {
    margin-inline-start: auto;
    color: var(--text-muted);
  }

  &:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  &:active {
    background: var(--primary-soft);
    transform: scale(0.98);
  }

  &.active {
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 600;
  }
}

.mobile-nav-btn {
  width: 100%;
  text-align: start;
  border: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-sub);
  cursor: pointer;
  background: none;
}

.mobile-nav-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 14px;
}

// ── Transitions ───────────────────────────────────────────────────────────────
.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition: opacity 0.2s ease;
}
.mobile-nav-enter-active .mobile-nav {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.mobile-nav-leave-active .mobile-nav {
  transition: transform 0.15s ease;
}
.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
}
.mobile-nav-enter-from .mobile-nav {
  transform: translateY(-12px);
}
.mobile-nav-leave-to .mobile-nav {
  transform: translateY(-8px);
}
</style>
