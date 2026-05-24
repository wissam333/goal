<template>
  <aside
    v-if="menuItems && menuItems.length"
    id="tour-sidebar"
    class="sidebar"
    :class="{
      collapsed: isCollapsed && !isMobile,
      dark: variant === 'dark',
      'mobile-open': isOpen && isMobile,
    }"
  >
    <!-- ── Header / user card ─────────────────────────────────────────────── -->
    <div v-if="$slots.header" class="sidebar-user">
      <slot name="header" />
    </div>

    <!-- ── Nav items ──────────────────────────────────────────────────────── -->
    <nav class="sidebar-nav">
      <template v-for="(item, i) in menuItems" :key="i">
        <div v-if="item.type === 'divider'" class="nav-divider" />

        <div v-else-if="item.type === 'group'" class="menu-group">
          <span class="group-text">{{ $t(item.label) }}</span>
        </div>

        <SharedUiNavigationMenuItem
          v-else
          :item="item"
          :level="0"
          :is-collapsed="isCollapsed"
          :is-mobile="isMobile"
          :expanded-keys="expandedKeys"
          @toggle-submenu="toggleSubmenu"
          @item-click="handleClick"
        />
      </template>
    </nav>

    <!-- ── Footer ─────────────────────────────────────────────────────────── -->
    <div class="sidebar-footer">
      <!-- Custom footer slot (falls back to built-in) -->
      <slot name="footer">
        <!-- ── Quick actions row ─────────────────────────────────────────── -->
        <div
          class="footer-actions"
          :class="{ centered: isCollapsed && !isMobile }"
        >
          <!-- Language toggle -->
          <button
            class="footer-btn mobile"
            :title="currentLocale === 'ar' ? 'English' : 'العربية'"
            @click="handleToggleLang"
          >
            <span class="footer-btn-icon">
              <Icon name="i-ph-translate-bold" size="17" />
            </span>
            <Transition name="label-fade">
              <span v-if="!isCollapsed || isMobile" class="footer-btn-label">
                {{ currentLocale === "ar" ? "English" : "العربية" }}
              </span>
            </Transition>
            <Transition name="label-fade">
              <span v-if="!isCollapsed || isMobile" class="lang-badge">
                {{ currentLocale === "ar" ? "EN" : "AR" }}
              </span>
            </Transition>
          </button>

          <!-- Theme toggle -->
          <div class="footer-theme-wrapper mobile">
            <button
              class="footer-btn"
              title="Theme"
              @click="isThemePanelOpen = !isThemePanelOpen"
            >
              <span class="footer-btn-icon">
                <Icon name="mdi:palette-outline" size="17" />
              </span>
              <Transition name="label-fade">
                <span v-if="!isCollapsed || isMobile" class="footer-btn-label">
                  {{ $t("Theme") }}
                </span>
              </Transition>
              <Transition name="label-fade">
                <span
                  v-if="(!isCollapsed || isMobile) && isDark"
                  class="theme-badge dark-badge"
                >
                  {{ $t("Dark") }}
                </span>
                <span
                  v-else-if="(!isCollapsed || isMobile) && !isDark"
                  class="theme-badge light-badge"
                >
                  {{ $t("Light") }}
                </span>
              </Transition>
            </button>

            <!-- Theme panel -->
            <Transition name="panel-up">
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
                    <Icon name="mdi:close" size="14" />
                  </button>
                </div>

                <!-- Mode -->
                <div class="theme-section">
                  <p class="theme-label">{{ $t("Mode") }}</p>
                  <div class="mode-toggle">
                    <button
                      class="mode-btn"
                      :class="{ active: !isDark }"
                      @click="() => isDark && toggleDark()"
                    >
                      <Icon name="mdi:white-balance-sunny" size="15" />
                      <span>{{ $t("Light") }}</span>
                    </button>
                    <button
                      class="mode-btn"
                      :class="{ active: isDark }"
                      @click="() => !isDark && toggleDark()"
                    >
                      <Icon name="mdi:moon-waning-crescent" size="15" />
                      <span>{{ $t("Dark") }}</span>
                    </button>
                  </div>
                </div>

                <!-- Color -->
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

          <!-- Divider -->
          <!-- <div class="footer-divider mobile" /> -->

          <!-- Logout -->
          <button
            class="footer-btn logout-btn mobile"
            :title="$t('logout')"
            @click="$emit('logout')"
          >
            <span class="footer-btn-icon">
              <Icon name="mdi:logout" size="17" />
            </span>
            <Transition name="label-fade">
              <span v-if="!isCollapsed || isMobile" class="footer-btn-label">
                {{ $t("logout") }}
              </span>
            </Transition>
          </button>
        </div>

        <!-- ── Collapse toggle (desktop only) ───────────────────────────── -->
        <button
          v-if="!isMobile"
          class="collapse-btn"
          @click.stop="toggleCollapse"
        >
          <span class="btn-icon">
            <Icon :name="collapseIcon" :size="18" />
          </span>
          <Transition name="label-fade">
            <span v-if="!isCollapsed" class="btn-label">{{
              $t("collapse")
            }}</span>
          </Transition>
        </button>
      </slot>
    </div>
  </aside>

  <Transition name="fade">
    <div v-if="isOpen && isMobile" class="sidebar-backdrop" @click="close" />
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  isCollapsed: { type: Boolean, default: false },
  menuItems: { type: Array, required: true },
  variant: { type: String, default: "default" },
  isMobile: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:isOpen",
  "update:isCollapsed",
  "item-click",
  "close",
  "toggle-collapse",
  "logout",
]);

const route = useRoute();
const { locale, setLocale } = useI18n();
const currentLocale = computed(() => locale.value);

// ── Theme ─────────────────────────────────────────────────────────────────────
const { primaryColor, isDark, palettes, setColor, toggleDark } = useTheme();
const isThemePanelOpen = ref(false);

// ── Lang ──────────────────────────────────────────────────────────────────────
const handleToggleLang = () => {
  setLocale(locale.value === "ar" ? "en" : "ar");
};

// ── Expanded state ────────────────────────────────────────────────────────────
const expandedKeys = ref([]);

const toggleSubmenu = (item) => {
  if (item.disabled) return;
  const idx = expandedKeys.value.indexOf(item.key);
  if (idx > -1) expandedKeys.value.splice(idx, 1);
  else expandedKeys.value.push(item.key);
};

const expandParentsForRoute = (items, path) => {
  if (!items?.length) return false;
  return items.some((item) => {
    if (!item) return false;
    const itemPath = typeof item.to === "string" ? item.to : item.to?.path;
    const isMatch = itemPath?.replace(/\/$/, "") === path?.replace(/\/$/, "");
    const childMatch = expandParentsForRoute(item.children, path);
    if ((isMatch || childMatch) && item.children?.length) {
      if (!expandedKeys.value.includes(item.key))
        expandedKeys.value.push(item.key);
    }
    return isMatch || childMatch;
  });
};

watch(
  () => route.path,
  (path) => expandParentsForRoute(props.menuItems, path),
  { immediate: true },
);

// ── Collapse icon ─────────────────────────────────────────────────────────────
const collapseIcon = computed(() => {
  if (props.isCollapsed)
    return locale.value === "ar"
      ? "mdi:chevron-double-left"
      : "mdi:chevron-double-right";
  return locale.value === "ar"
    ? "mdi:chevron-double-right"
    : "mdi:chevron-double-left";
});

// ── Actions ───────────────────────────────────────────────────────────────────
const close = () => {
  emit("update:isOpen", false);
  emit("close");
};

const toggleCollapse = () => {
  emit("update:isCollapsed", !props.isCollapsed);
  emit("toggle-collapse", !props.isCollapsed);
};

const handleClick = (item) => {
  if (item.disabled) return;
  emit("item-click", item);
  item.handler?.(item);
  if (props.isMobile) close();
};

// ── Click outside directive ───────────────────────────────────────────────────
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

defineExpose({ close, toggleCollapse, expandedKeys });
</script>

<style lang="scss" scoped>
// ── Sidebar ───────────────────────────────────────────────────────────────────
.sidebar {
  width: 260px;
  height: 100%;
  background: var(--bg-surface);
  border-inline-end: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.collapsed {
    width: 74px;

    :deep(.nav-label) {
      opacity: 0;
      width: 0;
      overflow: hidden;
      padding: 0;
      margin: 0;
    }

    .nav-label,
    .btn-label,
    .group-text,
    .chevron,
    .submenu {
      opacity: 0;
      width: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .nav-badge {
      opacity: 0;
      width: 0;
      overflow: hidden;
      padding: 0;
      margin: 0;
    }
    .nav-item {
      justify-content: center;
    }
    .collapse-btn {
      justify-content: center;
    }

    // footer actions: stack vertically, center icons
    .footer-actions {
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .footer-btn {
      width: 38px;
      padding: 9px 0;
      justify-content: center;
    }
    .footer-divider {
      width: 28px;
      height: 1px;
    }
    .lang-badge,
    .theme-badge {
      display: none;
    }
  }

  &.dark {
    background: var(--bg-page);
    border-color: var(--border-color);

    .nav-item {
      color: var(--text-muted);
    }
    .nav-item:hover {
      background: var(--bg-elevated);
      color: var(--text-primary);
    }
    .nav-item.active,
    .nav-item.child-active {
      background: var(--primary-soft);
      color: var(--primary);
    }
    .submenu {
      background: var(--bg-elevated);
    }
    .submenu-item {
      color: var(--text-muted);
      &:hover {
        color: var(--text-primary);
      }
      &.active {
        color: var(--primary);
      }
    }
    .menu-group .group-text {
      color: var(--text-muted);
    }
    .nav-divider {
      background: var(--border-color);
    }
    .sidebar-footer {
      border-color: var(--border-color);
    }
    .sidebar-user {
      border-color: var(--border-color);
    }
    .collapse-btn {
      color: var(--text-muted);
      &:hover {
        background: var(--bg-elevated);
        color: var(--text-primary);
      }
    }
  }
}

// ── User ──────────────────────────────────────────────────────────────────────
.sidebar-user {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
}

// ── Nav ───────────────────────────────────────────────────────────────────────
.sidebar-nav {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

// ── Groups ────────────────────────────────────────────────────────────────────
.menu-group {
  padding: 12px 10px 4px;
  flex-shrink: 0;
  .group-text {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-muted);
    white-space: nowrap;
    transition: opacity 0.2s;
  }
}

// ── Dividers ──────────────────────────────────────────────────────────────────
.nav-divider {
  height: 1px;
  background: var(--border-color);
  margin: 6px 4px;
  flex-shrink: 0;
}

// ── Footer ────────────────────────────────────────────────────────────────────
.sidebar-footer {
  padding: 10px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

// ── Footer actions row ────────────────────────────────────────────────────────
.footer-actions {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

.footer-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
  width: 100%;
  flex-shrink: 0;
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 500;
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  text-align: start;

  &:hover {
    background: var(--bg-page);
    color: var(--text-primary);
  }

  &.logout-btn {
    color: #ef4444;
    &:hover {
      background: rgba(239, 68, 68, 0.08);
      color: #ef4444;
    }
  }
}

.footer-btn-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}

.footer-btn-label {
  flex: 1;
  overflow: hidden;
}

// ── Lang badge ────────────────────────────────────────────────────────────────
.lang-badge {
  margin-inline-start: auto;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 5px;
  color: var(--text-primary);
  flex-shrink: 0;
}

// ── Theme badge ───────────────────────────────────────────────────────────────
.theme-badge {
  margin-inline-start: auto;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 5px;
  flex-shrink: 0;

  &.dark-badge {
    background: #1e293b;
    color: #94a3b8;
    border: 1px solid #334155;
  }
  &.light-badge {
    background: #fef9c3;
    color: #854d0e;
    border: 1px solid #fde68a;
  }
}

// ── Theme panel (pops upward) ─────────────────────────────────────────────────
.footer-theme-wrapper {
  position: relative;
}

.theme-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  inset-inline-start: 0;
  width: 220px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.13);
  z-index: 1002;
  overflow: hidden;
}

.theme-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px 9px;
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
    border-color: var(--bg-surface);
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

// ── Collapse button ───────────────────────────────────────────────────────────
.collapse-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 500;
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  &:hover {
    background: var(--bg-page);
    color: var(--text-primary);
  }
}

.btn-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}
.btn-label {
  transition: opacity 0.2s;
}

// ── Backdrop ──────────────────────────────────────────────────────────────────
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 999;
  backdrop-filter: blur(2px);
}

// ── Mobile ────────────────────────────────────────────────────────────────────
@media (max-width: 991px) {
  .sidebar {
    position: fixed;
    inset-inline-start: 0;
    top: 0;
    height: 100dvh;
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
    width: 260px !important;

    &.mobile-open {
      transform: translateX(0);
    }
  }
}

// ── Transitions ───────────────────────────────────────────────────────────────
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.label-fade-enter-active,
.label-fade-leave-active {
  transition: opacity 0.15s ease;
}
.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
}

.panel-up-enter-active,
.panel-up-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.panel-up-enter-from,
.panel-up-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

// ── RTL ───────────────────────────────────────────────────────────────────────
.bodyAR {
  @media (max-width: 991px) {
    .sidebar {
      transform: translateX(100%);
      &.mobile-open {
        transform: translateX(0);
      }
    }
  }
}
</style>
