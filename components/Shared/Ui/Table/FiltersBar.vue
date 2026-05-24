<template>
  <div class="filters-bar" :class="{ 'filters-bar--open': isOpen }">
    <!-- Top strip: search always visible + toggle btn on mobile -->
    <div class="filters-bar__top">
      <div class="filters-bar__search">
        <slot name="search" />
      </div>

      <div class="filters-bar__right">
        <!-- Mobile toggle -->
        <button class="filters-bar__toggle" @click="isOpen = !isOpen">
          <Icon :name="isOpen ? 'mdi:filter-off' : 'mdi:filter'" size="18" />
          <span class="toggle-label">{{ $t("filters") }}</span>
          <span v-if="activeCount > 0" class="toggle-dot" />
          <Icon
            name="mdi:chevron-down"
            size="16"
            class="toggle-chevron"
            :class="{ 'toggle-chevron--up': isOpen }"
          />
        </button>
      </div>
    </div>

    <!-- Collapsible filter body -->
    <transition name="slide-down">
      <div v-show="isOpen || !isMobile" class="filters-bar__body">
        <slot name="filters" />
        <!-- Mobile: action row -->
        <div v-if="isMobile" class="filters-bar__actions">
          <button class="fba-reset" @click="$emit('clear-all')">
            <Icon name="mdi:restore" size="14" />
            {{ $t("clearAll") }}
          </button>
          <button class="fba-apply" @click="isOpen = false">
            <Icon name="mdi:check" size="14" />
            {{ $t("apply") }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
defineEmits(["clear-all"]);

const props = defineProps({
  activeCount: { type: Number, default: 0 },
});

const isOpen = ref(false);
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) isOpen.value = false;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => window.removeEventListener("resize", checkMobile));
</script>

<style lang="scss" scoped>
.filters-bar {
  background: var(--bg-surface);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  margin-bottom: 1.25rem;

  &__top {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;
  }

  &--open &__top {
    border-bottom-color: var(--border-color);
  }

  &__search {
    flex: 1;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  &__clear {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.65rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1.5px solid var(--primary-mid);
    background: var(--primary-soft);
    color: var(--primary);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
    &:hover {
      background: var(--primary);
      color: #fff;
    }
  }

  &__toggle {
    display: none;
    align-items: center;
    gap: 0.3rem;
    padding: 0.45rem 0.85rem;
    border: 1.5px solid var(--border-color);
    border-radius: 12px;
    background: var(--bg-surface);
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-sub);
    cursor: pointer;
    position: relative;
    transition: all 0.2s;

    &:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    .toggle-label {
      font-size: 0.82rem;
    }

    .toggle-dot {
      position: absolute;
      top: 5px;
      inset-inline-end: 5px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--primary);
    }

    .toggle-chevron {
      transition: transform 0.25s;
      &--up {
        transform: rotate(180deg);
      }
    }
  }

  &__body {
    padding: 0.85rem 1.25rem 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    align-items: flex-end;
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
    width: 100%;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-color);
    margin-top: 0.25rem;

    .fba-reset {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      padding: 0.55rem;
      border: 1.5px solid var(--border-color);
      border-radius: 10px;
      background: var(--bg-surface);
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-sub);
      cursor: pointer;
      &:hover {
        border-color: var(--primary);
        color: var(--primary);
      }
    }

    .fba-apply {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      padding: 0.55rem;
      border: none;
      border-radius: 10px;
      background: var(--primary);
      font-size: 0.82rem;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      transition: filter 0.15s;
      &:hover {
        filter: brightness(1.1);
      }
    }
  }
}

// ── Transitions ────────────────────────────────────
.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.25s ease;
  overflow: hidden;
  max-height: 500px;
}
.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.2s;
}
.pop-enter-from,
.pop-leave-to {
  transform: scale(0.8);
  opacity: 0;
}

// ── Mobile ─────────────────────────────────────────
@media (max-width: 767px) {
  .filters-bar {
    &__toggle {
      display: inline-flex;
    }

    &__body {
      flex-direction: column;
      gap: 0.75rem;

      :deep(.filter-item) {
        width: 100% !important;
      }
    }
  }
}
</style>
