<template>
  <header
    class="dash-navbar"
    :class="{ 'is-rtl': isRtl, 'navbar-scrolled': isScrolled }"
  >
    <!-- ── Brand / Sidebar toggle area ──────────────────────────────────────── -->
    <div class="navbar-brand-zone" :style="brandZoneStyle">
      <NuxtLink :to="brandTo" class="brand-link">
        <div class="brand-mark" :style="brandMarkStyle">
          <Icon v-if="brandIcon" :name="brandIcon" size="18" />
          <span v-else class="brand-mark-letter">{{ brand?.charAt(0) }}</span>
        </div>
        <Transition name="brand-text">
          <span v-show="!sidebarCollapsed" class="brand-name">{{ brand }}</span>
        </Transition>
      </NuxtLink>
    </div>

    <!-- ── Mobile hamburger ──────────────────────────────────────────────────── -->
    <div class="mob-btn-cont">
      <button class="action-btn" title="share P2P" @click="showP2P = true">
        <Icon name="mdi:share-variant-outline" size="19" />
      </button>

      <button
        id="tour-mobile-hamburger"
        class="hamburger"
        @click="$emit('open-mobile-sidebar')"
        aria-label="Open menu"
      >
        <Icon name="mdi:menu" size="22" />
      </button>
    </div>

    <!-- ── Spacer ─────────────────────────────────────────────────────────────── -->
    <div class="navbar-spacer" />

    <!-- ── Search ─────────────────────────────────────────────────────────────── -->
    <div
      v-if="showSearch"
      class="navbar-search"
      :class="{ focused: searchFocused }"
      style="position: relative"
    >
      <Icon name="mdi:magnify" size="16" class="search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="searchPlaceholder"
        @focus="
          searchFocused = true;
          showDrop = true;
        "
        @blur="
          searchFocused = false;
          setTimeout(() => (showDrop = false), 150);
        "
        @input="onSearch"
        @keydown.escape="
          showDrop = false;
          searchQuery = '';
        "
        @keydown.enter="goToFirst"
      />
      <Transition name="clear-btn">
        <button v-if="searchQuery" class="search-clear" @click="clearSearch">
          <Icon name="mdi:close-circle" size="14" />
        </button>
      </Transition>

      <!-- Dropdown -->
      <SharedUiNavigationGlobalSearchDropdown
        :show="showDrop"
        :query="searchQuery"
        :results="searchResults"
        @select="clearSearch"
      />
    </div>

    <!-- ── Action buttons ─────────────────────────────────────────────────────── -->
    <div class="navbar-actions">
      <slot name="end" />
      <template v-for="(action, i) in actions" :key="i">
        <button
          v-if="!action.hidden"
          class="action-btn"
          :class="{ 'has-badge': action.badge }"
          :title="action.label"
          @click="$emit('action-click', action)"
        >
          <Icon :name="action.icon" size="19" />
          <span
            v-if="action.badge"
            class="action-badge"
            :class="action.badgeVariant || 'danger'"
          >
            {{ action.badge > 99 ? "99+" : action.badge }}
          </span>
        </button>
      </template>

      <!-- Theme panel trigger -->
      <div class="navbar-theme-wrapper">
        <button
          class="action-btn"
          title="Theme"
          @click="isThemePanelOpen = !isThemePanelOpen"
        >
          <Icon name="mdi:palette-outline" size="19" />
        </button>

        <Transition name="panel-slide">
          <div
            v-if="isThemePanelOpen"
            class="theme-panel"
            v-click-outside="() => (isThemePanelOpen = false)"
          >
            <div class="theme-panel-header">
              <span>{{ $t("Theme") }}</span>
              <button
                class="theme-panel-close"
                @click="isThemePanelOpen = false"
              >
                <Icon name="mdi:close" size="15" />
              </button>
            </div>

            <!-- Mode toggle -->
            <div class="theme-section">
              <p class="theme-label">{{ $t("Mode") }}</p>
              <div class="mode-toggle">
                <button
                  class="mode-btn"
                  :class="{ active: !isDark }"
                  @click="() => isDark && toggleDark()"
                >
                  <Icon name="mdi:white-balance-sunny" size="16" />
                  <span>{{ $t("Light") }}</span>
                </button>
                <button
                  class="mode-btn"
                  :class="{ active: isDark }"
                  @click="() => !isDark && toggleDark()"
                >
                  <Icon name="mdi:moon-waning-crescent" size="16" />
                  <span>{{ $t("Dark") }}</span>
                </button>
              </div>
            </div>

            <!-- Color palette -->
            <div class="theme-section">
              <p class="theme-label">{{ $t("Color") }}</p>
              <div class="palette-grid">
                <button
                  v-for="swatch in palettes"
                  :key="swatch.value"
                  class="swatch"
                  :class="{ active: primaryColor === swatch.value }"
                  :style="{ '--sc': swatch.value }"
                  :title="swatch.label"
                  @click="setColor(swatch.value)"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <div v-if="actions?.length && showUser" class="navbar-divider" />

      <!-- ── User area with dropdown ── -->
      <div v-if="showUser" class="navbar-user-wrapper">
        <div class="navbar-user" @click="toggleUserMenu">
          <div class="user-avatar" :style="avatarStyle">
            <img
              v-if="user?.avatar"
              :src="user.avatar"
              :alt="computedUserName"
              class="avatar-img"
            />
            <span v-else class="avatar-letter">{{
              computedUserName?.charAt(0)?.toUpperCase()
            }}</span>
            <span v-if="user?.online" class="online-dot" />
          </div>

          <div class="user-info">
            <div class="user-name">{{ computedUserName }}</div>
            <div class="user-role">{{ computedUserRole }}</div>
          </div>

          <Icon
            name="mdi:chevron-down"
            size="14"
            class="user-chevron"
            :class="{ rotated: isUserMenuOpen }"
          />
        </div>

        <!-- Dropdown Menu -->
        <Transition name="dropdown">
          <div
            v-if="isUserMenuOpen"
            class="user-dropdown"
            v-click-outside="closeUserMenu"
          >
            <!-- Language Toggle -->
            <button class="dropdown-item language-item" @click="toggleLang">
              <Icon name="i-ph-translate-bold" size="18" />
              <span>{{ $i18n.locale === "ar" ? "English" : "العربية" }}</span>
              <span class="lang-badge">{{
                $i18n.locale === "ar" ? "EN" : "AR"
              }}</span>
            </button>

            <div class="dropdown-divider" />

            <NuxtLink
              v-for="item in userMenuItems"
              :key="item.to"
              :to="item.to"
              class="dropdown-item"
              @click="closeUserMenu"
            >
              <Icon :name="item.icon" size="18" />
              <span>{{ $t(item.label) }}</span>
              <span
                v-if="item.badge"
                class="item-badge"
                :class="item.badgeVariant"
              >
                {{ item.badge }}
              </span>
            </NuxtLink>

            <!-- <div class="dropdown-divider" /> -->

            <!-- Logout — opens confirm modal -->
            <button
              class="dropdown-item logout-item"
              @click="openLogoutConfirm"
            >
              <Icon name="mdi:logout" size="18" />
              <span>{{ $t("logout") }}</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ── Logout confirm modal ───────────────────────────────────────────────── -->
    <SharedUiDialogAppModal
      v-model="showLogoutModal"
      :title="$t('confirmLogout')"
      max-width="400px"
    >
      <div class="logout-modal-body">
        <div class="logout-icon-wrap">
          <Icon name="mdi:logout" size="32" />
        </div>
        <p>{{ $t("logoutConfirmMessage") }}</p>
      </div>

      <template #actions>
        <div class="d-flex gap-2 justify-content-end">
          <SharedUiButtonBase
            variant="outline"
            @click="showLogoutModal = false"
          >
            {{ $t("cancel") }}
          </SharedUiButtonBase>
          <SharedUiButtonBase
            variant="error"
            icon-left="mdi:logout"
            :loading="isLoggingOut"
            @click="handleLogout"
          >
            {{ $t("logout") }}
          </SharedUiButtonBase>
        </div>
      </template>
    </SharedUiDialogAppModal>
  </header>
  <P2PSyncModal v-model="showP2P" @synced="refreshData" />
</template>

<script setup>
const NuxtLink = resolveComponent("NuxtLink");
const { locale, setLocale } = useI18n();
const showP2P = ref(false);
const { logout } = useAuth();
const props = defineProps({
  sidebarCollapsed: { type: Boolean, default: false },
  sidebarWidth: { type: Number, default: 260 },
  sidebarCollapsedWidth: { type: Number, default: 72 },
  brand: { type: String, default: "UAE Hand Ball" },
  brandIcon: { type: String, default: "mdi:layers-triple" },
  brandTo: { type: String, default: "/" },
  brandColor: { type: String, default: "#0c1739" },
  showSearch: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: "Search…" },
  actions: { type: Array, default: () => [] },
  showUser: { type: Boolean, default: true },
  userMenuItems: {
    type: Array,
    default: () => [
      {
        to: "/dashboard/orders",
        icon: "mdi:receipt-text-outline",
        label: "sidebar.orders",
      },
      {
        to: "/dashboard",
        icon: "mdi:view-dashboard",
        label: "sidebar.dashboard",
      },
    ],
  },
  isRtl: { type: Boolean, default: false },
});

const emit = defineEmits([
  "open-mobile-sidebar",
  "action-click",
  "user-click",
  "search",
  "logout",
]);

// ── User info from session ─────────────────────────────────────────
const { staff } = useAuth();

const computedUserName = computed(() => staff.value?.full_name ?? "Staff");

const computedUserRole = computed(() => staff.value?.role ?? "");

// ── Local state ────────────────────────────────────────────────────
const searchQuery = ref("");
const searchFocused = ref(false);
const isScrolled = ref(false);
const isUserMenuOpen = ref(false);
const showLogoutModal = ref(false);
const isLoggingOut = ref(false);

// ── Computed styles ────────────────────────────────────────────────
const brandZoneStyle = computed(() => ({
  width: props.sidebarCollapsed
    ? `${props.sidebarCollapsedWidth}px`
    : `${props.sidebarWidth}px`,
}));

const { primaryColor, isDark, palettes, setColor, toggleDark } = useTheme();

const isThemePanelOpen = ref(false);

// update existing computed styles:
const brandMarkStyle = computed(() => ({ background: primaryColor.value }));
const avatarStyle = computed(() => ({ background: primaryColor.value }));

// ── Methods ────────────────────────────────────────────────────────
const { search } = useGlobalSearch();
const showDrop = ref(false);
const searchResults = ref([]);

const onSearch = () => {
  searchResults.value = search(searchQuery.value);
  showDrop.value = true;
};

const goToFirst = () => {
  if (searchResults.value.length > 0) {
    navigateTo(searchResults.value[0].to);
    clearSearch();
  }
};

// update clearSearch
const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
  showDrop.value = false;
  emit("search", "");
};

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
  emit("user-click");
};

const closeUserMenu = () => {
  isUserMenuOpen.value = false;
};

const toggleLang = () => {
  const newLang = locale.value === "ar" ? "en" : "ar";
  setLocale(newLang);
  if (import.meta.client) {
    localStorage.setItem("locale", newLang);
  }
  closeUserMenu();
};

const openLogoutConfirm = () => {
  closeUserMenu();
  showLogoutModal.value = true;
};

const handleLogout = async () => {
  isLoggingOut.value = true;
  try {
    void("logging out.....");
    await logout(); // clears session + Preferences + navigates to /auth/login
  } finally {
    isLoggingOut.value = false;
    showLogoutModal.value = false;
  }
};

// ── Click outside directive ────────────────────────────────────────
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => {
      if (!el.contains(e.target) && el !== e.target) binding.value();
    };
    document.addEventListener("mousedown", el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener("mousedown", el._clickOutside);
  },
};

// ── Scroll shadow ──────────────────────────────────────────────────
onMounted(() => {
  const onScroll = () => {
    const main = document.querySelector(".main-area");
    isScrolled.value = main ? main.scrollTop > 4 : false;
  };
  const main = document.querySelector(".main-area");
  main?.addEventListener("scroll", onScroll);
  onUnmounted(() => main?.removeEventListener("scroll", onScroll));
});
</script>

<style lang="scss" scoped>
$h: 64px;
$transition: cubic-bezier(0.4, 0, 0.2, 1);

// ── Navbar ────────────────────────────────────────────────────────────────────
.dash-navbar {
  height: $h;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-inline-end: 20px; // ← replaces RTL padding swap
  gap: 10px;
  z-index: 100;
  transition: box-shadow 0.2s ease;

  @media (max-width: 991px) {
    justify-content: space-between;
  }
  &.navbar-scrolled {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}

// ── Brand zone ────────────────────────────────────────────────────────────────
.navbar-brand-zone {
  height: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 20px;
  overflow: hidden;
  transition: width 0.3s $transition;
  border-inline-end: 1px solid var(--border-color); // ← logical prop
  @media (max-width: 379px) {
    width: 200px !important;
    min-width: 200px !important;
  }
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.05rem;
  white-space: nowrap;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  // background set via :style binding

  .brand-mark-letter {
    font-weight: 800;
    font-size: 0.9rem;
  }
}

.brand-name {
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

// ── Hamburger ─────────────────────────────────────────────────────────────────
.hamburger {
  display: none;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  cursor: pointer;
  flex-shrink: 0;

  @media (max-width: 991px) {
    display: flex;
  }
}

.navbar-spacer {
  flex: 1;
  @media (max-width: 991px) {
    display: none;
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
.navbar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 0 10px 0 12px;
  height: 38px;
  width: 220px;
  transition: width 0.25s $transition, border-color 0.2s;
  flex-shrink: 0;

  &.focused {
    border-color: var(--primary);
    width: 270px;
  }

  input {
    flex: 1;
    border: none;
    background: none;
    font-size: 0.85rem;
    color: var(--text-primary);
    outline: none;
    min-width: 0;
    &::placeholder {
      color: var(--text-muted);
    }
  }

  .search-icon {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .search-clear {
    background: none;
    border: none;
    padding: 0;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    &:hover {
      color: var(--text-primary);
    }
  }

  @media (max-width: 767px) {
    display: none;
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  @media (max-width: 991px) {
    display: none;
  }
}

.action-btn {
  position: relative;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover {
    background: var(--bg-page);
    border-color: var(--border-color);
    color: var(--text-primary);
  }
}

.action-badge {
  position: absolute;
  top: 4px;
  inset-inline-end: 4px; // ← replaces RTL override
  min-width: 16px;
  height: 16px;
  font-size: 0.6rem;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 2px solid var(--bg-surface); // ← was hardcoded #fff
  line-height: 1;

  &.danger {
    background: #ef4444;
    color: #fff;
  }
  &.primary {
    background: var(--primary);
    color: #fff;
  } // ← follows theme
  &.success {
    background: #22c55e;
    color: #fff;
  }
  &.warning {
    background: #f59e0b;
    color: #fff;
  }
}

.navbar-divider {
  width: 1px;
  height: 28px;
  background: var(--border-color);
  margin: 0 6px;
  flex-shrink: 0;
}

// ── User ──────────────────────────────────────────────────────────────────────
.navbar-user-wrapper {
  position: relative;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover {
    background: var(--bg-page);
    border-color: var(--border-color);
  }
}

.user-avatar {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  // background set via :style binding

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 9px;
  }
}

.online-dot {
  position: absolute;
  bottom: 0;
  inset-inline-end: 0; // ← replaces RTL override
  width: 9px;
  height: 9px;
  background: #22c55e;
  border-radius: 50%;
  border: 2px solid var(--bg-surface); // ← was hardcoded #fff
}

.user-info {
  @media (max-width: 575px) {
    display: none;
  }
}

.user-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
  white-space: nowrap;
}

.user-role {
  font-size: 0.71rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.user-chevron {
  color: var(--text-muted);
  transition: transform 0.2s ease;
  &.rotated {
    transform: rotate(180deg);
  }
  @media (max-width: 575px) {
    display: none;
  }
}

// ── User dropdown ─────────────────────────────────────────────────────────────
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  inset-inline-end: 0; // ← replaces .is-rtl override
  min-width: 220px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
  padding: 8px;
  z-index: 1000;
  animation: dropdownFade 0.2s ease;

  @keyframes dropdownFade {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-decoration: none;
  border: none;
  background: transparent;
  width: 100%;
  text-align: start; // ← logical, replaces RTL override
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--bg-page);
  }

  &.logout-item {
    color: #ef4444;
    &:hover {
      background: rgba(239, 68, 68, 0.08);
    }
  }

  &.language-item .lang-badge {
    margin-inline-start: auto; // ← replaces RTL override
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px 6px;
    background: var(--bg-elevated);
    border-radius: 4px;
    color: var(--text-primary);
  }
}

.item-badge {
  margin-inline-start: auto; // ← replaces RTL override
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 12px;

  &.danger {
    background: #ef4444;
    color: #fff;
  }
  &.primary {
    background: var(--primary);
    color: #fff;
  }
  &.success {
    background: #22c55e;
    color: #fff;
  }
  &.warning {
    background: #f59e0b;
    color: #fff;
  }
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 8px 0;
}

// ── Logout modal body ─────────────────────────────────────────────────────────
.logout-modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 0.5rem 0 1rem;

  .logout-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  p {
    font-size: 0.95rem;
    color: var(--text-sub);
    margin: 0;
    max-width: 260px;
  }
}

// ── Theme panel ───────────────────────────────────────────────────────────────
.navbar-theme-wrapper {
  position: relative;
}

.theme-panel {
  position: absolute;
  top: calc(100% + 10px);
  inset-inline-end: 0; // ← handles RTL automatically
  width: 220px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.13);
  z-index: 1001;
  overflow: hidden;
}

.theme-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-elevated);
}

.theme-panel-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  padding: 2px;
  border-radius: 6px;
  &:hover {
    color: var(--text-primary);
  }
}

.theme-section {
  padding: 12px 14px 8px;
  & + & {
    padding-top: 4px;
  }
}

.theme-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  margin: 0 0 9px;
}

.mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding-bottom: 4px;
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 8px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;

  &.active {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
    font-weight: 600;
  }
  &:not(.active):hover {
    border-color: var(--primary);
    color: var(--primary);
  }
}

.palette-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding-bottom: 4px;
}

.swatch {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: var(--sc);
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative;

  &:hover {
    transform: scale(1.18);
  }

  &.active {
    border-color: var(--bg-surface); // ← was hardcoded #fff
    box-shadow: 0 0 0 2px var(--sc), 0 2px 6px rgba(0, 0, 0, 0.2);
    transform: scale(1.12);

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' fill='white'/%3E%3C/svg%3E")
        center/12px no-repeat;
    }
  }
}

// ── Transitions ───────────────────────────────────────────────────────────────
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.brand-text-enter-active,
.brand-text-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.brand-text-enter-from,
.brand-text-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.clear-btn-enter-active,
.clear-btn-leave-active {
  transition: opacity 0.15s;
}
.clear-btn-enter-from,
.clear-btn-leave-to {
  opacity: 0;
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

.mob-btn-cont {
  display: flex;
  gap: 16px;
}
</style>
