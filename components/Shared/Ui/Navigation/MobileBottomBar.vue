<!-- components/Shared/Ui/Navigation/MobileBottomBar.vue -->
<!--
  Native-style mobile bottom bar — fast-action shortcuts.
  Lives ALONGSIDE the sidebar (not a replacement).
  Only renders on mobile/Capacitor. Teleports to <body>.

  Usage:
    <SharedUiNavigationMobileBottomBar :items="bottomItems" />

  Item shape:
    { key: string, label: string (i18n key), icon: string (mdi:*), to: string, badge?: number }
-->
<template>
  <Teleport to="body">
    <nav
      v-if="show"
      id="tour-bottom-nav"
      class="mbb"
      :class="locale === 'ar' ? 'mbb--rtl' : 'mbb--ltr'"
      role="navigation"
      :aria-label="$t('bottomNav', 'Quick navigation')"
    >
      <button
        v-for="item in items.slice(0, 5)"
        :key="item.key"
        class="mbb__tab"
        :class="{ 'mbb__tab--active': isActive(item) }"
        :aria-label="$t(item.label)"
        :aria-current="isActive(item) ? 'page' : undefined"
        @click="go(item)"
      >
        <!-- Icon + badge -->
        <div class="mbb__icon-wrap">
          <Icon :name="item.icon" class="mbb__icon" />
          <span v-if="item.badge > 0" class="mbb__badge">
            {{ item.badge > 99 ? "99+" : item.badge }}
          </span>
        </div>

        <!-- Label -->
        <span class="mbb__label">{{ $t(item.label) }}</span>

        <!-- Active dot -->
        <span v-if="isActive(item)" class="mbb__dot" />
      </button>
    </nav>

    <!-- Push page content up so nothing hides behind the bar -->
    <div v-if="show" class="mbb__spacer" />
  </Teleport>
</template>

<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] },
});

const emit = defineEmits(["item-click"]);
const { locale } = useI18n();
const router = useRouter();
const route = useRoute();

const show = ref(false);
const mql = ref(null);
const checkShow = () => {
  show.value =
    (typeof window !== "undefined" && !!window?.Capacitor) ||
    window.innerWidth <= 991;
};
onMounted(() => {
  checkShow();
  mql.value = window.matchMedia("(max-width: 991px)");
  if (mql.value) {
    mql.value.addEventListener("change", checkShow);
  } else {
    window.addEventListener("resize", checkShow);
  }
});
onUnmounted(() => {
  if (mql.value) {
    mql.value.removeEventListener("change", checkShow);
  } else {
    window.removeEventListener("resize", checkShow);
  }
});

const isActive = (item) => item.to && route.path === item.to;

const go = (item) => {
  if (item.to && !isActive(item)) router.push(item.to);
  emit("item-click", item);
};
</script>

<style lang="scss" scoped>
.mbb {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 900;
  height: 56px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  display: flex;
  align-items: stretch;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);

  &.mbb--rtl {
    direction: rtl;
  }
}

:global(.dark) .mbb {
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.35);
}

:global(body) {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.mbb__tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 6px 2px 2px;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  transition: background 0.12s, transform 0.12s;
  border-radius: 12px;
  margin: 4px 2px;
  min-height: var(--touch-target);

  &:active {
    background: var(--primary-soft);
    transform: scale(0.95);
  }
}

// ─── Icon container ───────────────────────────────────────────────────────────
.mbb__icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  border-radius: 10px;
  transition: background 0.2s ease,
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mbb__icon {
  font-size: 22px;
  color: var(--text-muted);
  transition: color 0.2s ease;
  // Make sure Nuxt Icon renders at the right size
  width: 22px;
  height: 22px;
}

// ─── Active tab ───────────────────────────────────────────────────────────────
.mbb__tab--active {
  .mbb__icon-wrap {
    background: var(--primary-soft);
    transform: translateY(-1px) scale(1.05);
  }

  .mbb__icon {
    color: var(--primary);
  }

  .mbb__label {
    color: var(--primary);
    font-weight: 700;
  }
}

// ─── Label ────────────────────────────────────────────────────────────────────
.mbb__label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
  line-height: 1;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
.mbb__badge {
  position: absolute;
  top: -3px;
  inset-inline-end: -5px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  // Punch out from the icon background
  border: 2px solid var(--bg-surface);
}

// ─── Active top dot ───────────────────────────────────────────────────────────
.mbb__dot {
  position: absolute;
  top: 0;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 3px;
  border-radius: 0 0 4px 4px;
  background: var(--primary);
  animation: dot-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  .mbb--rtl & {
    transform: translateX(50%);
  }
}

@keyframes dot-in {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 18px;
    opacity: 1;
  }
}

// ─── Spacer so page content isn't hidden under bar ───────────────────────────
.mbb__spacer {
  height: calc(56px + env(safe-area-inset-bottom, 0px));
  flex-shrink: 0;
  pointer-events: none;
}
</style>
