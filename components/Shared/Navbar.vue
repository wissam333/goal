<template>
  <header class="navbar" :class="{ scrolled: isScrolled }">
    <div class="navbar-inner container">
      <NuxtLink :to="logoLink" class="navbar-logo">
        <img v-if="showLogo" :src="logoUrl" class="brand-icon" alt="Logo" width="50" height="50" />
        <div class="brand-text">
          <span v-if="showSkeleton" class="skeleton-text skeleton-title" />
          <span v-else class="brand-name">{{ displayTitle }}</span>
          <span v-if="currentLeague?.season_label" class="brand-season">{{ currentLeague.season_label }}</span>
        </div>
      </NuxtLink>
      <NuxtLink v-if="isLeagueRoute" to="/" class="navbar-portal-link" title="جميع الدوريات">
        <Icon name="mdi:apps" size="20" />
      </NuxtLink>

      <!-- Desktop nav links -->
      <nav v-if="isLeagueRoute" class="navbar-links" aria-label="main navigation">
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

        <!-- User menu -->
        <ClientOnly>
          <template v-if="authLoading">
            <div class="ctrl-btn" style="opacity:0.4">
              <Icon name="mdi:loading" size="16" class="spin" />
            </div>
          </template>
          <template v-else-if="user">
            <div class="user-menu" ref="userMenuRef">
              <button class="ctrl-btn user-btn" @click="userMenuOpen = !userMenuOpen">
                <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" class="user-avatar-img" />
                <span v-else class="user-avatar-sm">{{ displayName.charAt(0) }}</span>
              </button>
              <Transition name="dropdown">
                <div v-if="userMenuOpen" class="user-dropdown">
                  <NuxtLink to="/account" class="dropdown-item" @click="userMenuOpen = false">
                    <Icon name="mdi:account-outline" size="16" />
                    <span>{{ $t('auth.myAccount') }}</span>
                  </NuxtLink>
                  <button class="dropdown-item logout-item" @click="handleLogout">
                    <Icon name="mdi:logout" size="16" />
                    <span>{{ $t('auth.logout') }}</span>
                  </button>
                </div>
              </Transition>
            </div>
          </template>
          <template v-else>
            <button class="ctrl-btn login-btn" @click="openLoginModal">
              <Icon name="mdi:login" size="16" />
              <span class="login-label">{{ $t('auth.login') }}</span>
            </button>
          </template>
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
        <!-- <button
          class="ctrl-btn lang-btn"
          :aria-label="
            locale === 'ar' ? 'Switch to English' : 'التبديل للعربية'
          "
          @click="toggleLang"
        >
          {{ locale === "ar" ? "EN" : "ع" }}
        </button> -->

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
          <template v-if="isLeagueRoute">
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
          </template>

          <div class="mobile-nav-divider" />

          <button
            class="mobile-nav-item mobile-nav-btn"
            @click="
              theme.toggleMode();
              mobileOpen = false;
            "
          >
            <Icon
              :name="
                theme.isDark.value
                  ? 'mdi:white-balance-sunny'
                  : 'mdi:moon-waning-crescent'
              "
              size="18"
              aria-hidden="true"
            />
            <span>{{
              theme.isDark.value ? $t("lightMode") : $t("darkMode")
            }}</span>
          </button>

          <!-- <button
            class="mobile-nav-item mobile-nav-btn"
            @click="
              toggleLang();
              mobileOpen = false;
            "
          >
            <Icon name="mdi:translate" size="18" aria-hidden="true" />
            <span>{{ locale === "ar" ? "English" : "العربية" }}</span>
          </button> -->
        </div>
      </div>
    </Transition>

    <SharedUiDialogAppModal v-model="modalOpen" :title="authTab === 'login' ? $t('auth.loginTitle') : $t('auth.registerTitle')" max-width="420px">
      <div class="auth-tabs">
        <button class="auth-tab" :class="{ active: authTab === 'login' }" @click="authTab = 'login'">{{ $t('auth.login') }}</button>
        <button class="auth-tab" :class="{ active: authTab === 'register' }" @click="authTab = 'register'">{{ $t('auth.register') }}</button>
      </div>
      <p class="auth-subtitle">{{ authTab === 'login' ? $t('auth.loginSubtitle') : $t('auth.registerSubtitle') }}</p>
      <button class="google-btn" @click="handleAuthGoogle" :disabled="authGoogleLoading">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>{{ $t('auth.googleLogin') }}</span>
      </button>
      <div class="auth-divider"><span>{{ $t('auth.or') }}</span></div>
      <form @submit.prevent="handleAuthSubmit" class="auth-form">
        <SharedUiFormBaseInput v-model="authEmail" type="email" :label="$t('auth.email')" :placeholder="$t('auth.email')" size="lg" required />
        <SharedUiFormBaseInput v-model="authPassword" type="password" :label="$t('auth.password')" :placeholder="$t('auth.password')" size="lg" required />
        <SharedUiFormBaseInput v-if="authTab === 'register'" v-model="authConfirm" type="password" :label="$t('auth.confirmPassword')" :placeholder="$t('auth.confirmPassword')" :error="authPasswordError" size="lg" required />
        <p v-if="authError" class="auth-error">{{ authError }}</p>
        <p v-if="authSuccess" class="auth-success">{{ authSuccess }}</p>
        <SharedUiButtonBase type="submit" variant="primary" size="lg" :loading="authBusy" class="auth-submit">
          {{ authTab === 'login' ? $t('auth.signIn') : $t('auth.createAccount') }}
        </SharedUiButtonBase>
      </form>
      <p class="auth-switch">
        <template v-if="authTab === 'login'">
          {{ $t('auth.noAccount') }} <button class="auth-link" @click="authTab = 'register'">{{ $t('auth.createAccount') }}</button>
        </template>
        <template v-else>
          {{ $t('auth.hasAccount') }} <button class="auth-link" @click="authTab = 'login'">{{ $t('auth.signIn') }}</button>
        </template>
      </p>
    </SharedUiDialogAppModal>
  </header>
</template>

<script setup>
const theme = useTheme();
const { locale, setLocale } = useI18n();
const route = useRoute();
const config = useRuntimeConfig();
const { name: appTitle } = useAppTitle();
const auth = useAuth();
const { t } = useI18n();
const { league, leagueSlug, isLeagueRoute, leaguePath, pending } = useCurrentLeague();

const { user, profile, loading: authLoading } = auth;

const currentLeague = league
const showSkeleton = computed(() => isLeagueRoute.value && pending.value)

const displayTitle = computed(() => {
  if (!isLeagueRoute.value) return 'Green Ball'
  if (currentLeague.value?.name) return currentLeague.value.name
  return ''
})

const logoUrl = computed(() => {
  if (isLeagueRoute.value) return currentLeague.value?.logo || ''
  return '/logo.png'
})

const showLogo = computed(() => {
  if (isLeagueRoute.value) return !!currentLeague.value?.logo
  return true
})

const logoLink = computed(() => {
  if (isLeagueRoute.value) return leaguePath()
  return '/'
})

const isScrolled = ref(false);
const mobileOpen = ref(false);
const userMenuOpen = ref(false);
const userMenuRef = ref(null);

const displayName = computed(() => {
  return profile.value?.display_name || user.value?.user_metadata?.full_name || user.value?.email || ""
});

const avatarUrl = computed(() => {
  return profile.value?.avatar_url || user.value?.user_metadata?.avatar_url || user.value?.user_metadata?.picture || null
})

const modalOpen = ref(false)
const openLoginModal = () => {
  modalOpen.value = true
}
const authTab = ref('login')
const authEmail = ref('')
const authPassword = ref('')
const authConfirm = ref('')
const authError = ref('')
const authSuccess = ref('')
const authBusy = ref(false)
const authGoogleLoading = ref(false)
const authPasswordError = ref('')

const handleAuthGoogle = async () => {
  authGoogleLoading.value = true
  await auth.signInWithGoogle()
  authGoogleLoading.value = false
}

const handleAuthSubmit = async () => {
  authError.value = ''
  authSuccess.value = ''
  authPasswordError.value = ''
  authBusy.value = true
  if (authTab.value === 'register') {
    if (authPassword.value !== authConfirm.value) {
      authError.value = t('auth.passwordMismatch')
      authBusy.value = false
      return
    }
    const { data, error: err } = await auth.signUp(authEmail.value, authPassword.value)
    authBusy.value = false
    if (err) {
      authError.value = err.message?.includes('already registered') ? t('auth.emailInUse') : err.message?.includes('weak') ? t('auth.weakPassword') : err.message || t('auth.emailInUse')
      return
    }
    if (data?.session) {
      modalOpen.value = false
    } else {
      authSuccess.value = t('auth.registrationSuccess')
      authTab.value = 'login'
    }
  } else {
    const { error: err } = await auth.signIn(authEmail.value, authPassword.value)
    authBusy.value = false
    if (err) {
      authError.value = t('auth.loginError')
      return
    }
    modalOpen.value = false
  }
}

const handleLogout = async () => {
  userMenuOpen.value = false;
  await auth.signOut();
};

onMounted(() => {
  const onClickOutside = (e) => {
    if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
      userMenuOpen.value = false;
    }
  };
  document.addEventListener("click", onClickOutside);
  onUnmounted(() => document.removeEventListener("click", onClickOutside));
});

const navItems = computed(() => {
  const base = isLeagueRoute.value ? leaguePath().replace(/\/+$/, '') : ''
  return [
    { key: "home", label: "nav.home", icon: "mdi:home-outline", to: base || "/" },
    { key: "standings", label: "nav.standings", icon: "mdi:table", to: `${base}/standings` },
    { key: "fixtures", label: "nav.fixtures", icon: "mdi:calendar-outline", to: `${base}/fixtures` },
    { key: "bracket", label: "nav.bracket", icon: "mdi:tournament", to: `${base}/bracket` },
    { key: "teams", label: "nav.teams", icon: "mdi:shield-outline", to: `${base}/teams` },
    { key: "stats", label: "nav.stats", icon: "mdi:chart-bar", to: `${base}/stats` },
  ]
})

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
  gap: 6px;
  text-decoration: none;
  flex-shrink: 0;
  @media (max-width: 991.98px) {
    gap: 4px;
  }
  &:hover .brand-name {
    color: var(--primary);
  }
}

.brand-icon {
  width: 50px;
  height: 50px;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 8px;

  @media (max-width: 991.98px) {
    width: 40px;
    height: 40px;
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

.login-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  width: auto;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary);
  &:hover { color: var(--primary); }
  .login-label {
    @media (max-width: 991.98px) { display: none; }
  }
}

.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.user-menu {
  position: relative;
}

.user-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  padding: 0;
  &:hover { background: var(--primary-soft); }
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-sm {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  inset-inline-end: 0;
  min-width: 160px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 900;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-primary);
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: start;
  text-decoration: none;
  transition: all 0.1s;
  &:hover { background: var(--bg-elevated); }
}

.logout-item {
  color: #ef4444;
  &:hover { background: rgba(239, 68, 68, 0.08); }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
.skeleton-text {
  display: inline-block;
  border-radius: 6px;
  background: var(--bg-elevated);
  position: relative;
  overflow: hidden;
  vertical-align: middle;
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 30%, transparent 60%);
    animation: sk-shimmer 1.8s ease-in-out infinite;
  }
}
.skeleton-title {
  width: 130px;
  height: 1.1rem;
}
@keyframes sk-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.navbar-portal-link {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px;
  border-radius: 8px;
  color: var(--text-muted);
  text-decoration: none;
  flex-shrink: 0;
  transition: all 0.15s;
  &:hover { background: var(--primary-soft); color: var(--primary); }
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

<style lang="scss">
.auth-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}
.auth-tab {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &.active {
    background: var(--bg-surface);
    color: var(--text-primary);
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
}
.auth-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  margin: 4px 0 20px;
}
.google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: var(--bg-surface); border-color: var(--primary-mid); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.auth-error {
  color: #ef4444;
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
}
.auth-success {
  color: #22c55e;
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
}
.auth-submit {
  width: 100%;
  margin-top: 4px;
}
.auth-switch {
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 16px 0 0;
}
.auth-link {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.82rem;
  padding: 0;
  &:hover { text-decoration: underline; }
}
</style>
