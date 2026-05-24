<template>
  <div
    class="menu-item-wrapper"
    :class="{ 'has-children': item.children?.length }"
  >
    <!-- Item with children (dropdown) -->
    <template v-if="item.children?.length">
      <button
        class="nav-item"
        :class="[
          item.class,
          `level-${level}`,
          {
            disabled: item.disabled,
            open: isExpanded,
          },
        ]"
        @click="toggle"
      >
        <span class="nav-icon">
          <Icon :name="item.icon" :size="20" />
        </span>
        <span class="nav-label">{{ $t(item.label) }}</span>
        <span
          v-if="item.badge && (!isCollapsed || isMobile)"
          class="nav-badge"
          :class="item.badgeVariant"
        >
          {{ item.badge }}
        </span>
        <span class="chevron" :class="{ rotated: isExpanded }">
          <Icon name="mdi:chevron-down" :size="16" />
        </span>
      </button>

      <Transition name="submenu">
        <div v-if="isExpanded" class="submenu" :class="`level-${level + 1}`">
          <MenuItem
            v-for="(child, index) in item.children"
            :key="index"
            :item="child"
            :level="level + 1"
            :is-collapsed="isCollapsed"
            :is-mobile="isMobile"
            :expanded-keys="expandedKeys"
            @toggle-submenu="$emit('toggle-submenu', $event)"
            @item-click="$emit('item-click', $event)"
          />
        </div>
      </Transition>
    </template>

    <!-- Regular item (no children) — NuxtLink gets router-link-exact-active automatically -->
    <component
      :is="item.to ? NuxtLink : item.external ? 'a' : 'button'"
      v-else
      class="nav-item"
      :class="[item.class, `level-${level}`, { disabled: item.disabled }]"
      v-bind="getLinkAttributes(item)"
      @click="handleClick(item)"
    >
      <span class="nav-icon">
        <Icon :name="item.icon" :size="20" />
      </span>
      <span class="nav-label">{{ $t(item.label) }}</span>
      <span
        v-if="item.badge && (!isCollapsed || isMobile)"
        class="nav-badge"
        :class="item.badgeVariant"
      >
        {{ item.badge }}
      </span>
    </component>
  </div>
</template>

<script setup>
const NuxtLink = resolveComponent("NuxtLink");

const props = defineProps({
  item: { type: Object, required: true },
  level: { type: Number, default: 0 },
  isCollapsed: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false },
  expandedKeys: { type: Array, default: () => [] },
});

const emit = defineEmits(["toggle-submenu", "item-click"]);

const isExpanded = computed(() => props.expandedKeys.includes(props.item.key));

const toggle = () => {
  if (props.item.disabled) return;
  emit("toggle-submenu", props.item);
};

const handleClick = (item) => {
  if (item.disabled) return;
  emit("item-click", item);
};

const getLinkAttributes = (item) => {
  if (item.external)
    return { href: item.to, target: "_blank", rel: "noopener noreferrer" };
  if (item.to) return { to: item.to };
  return {};
};
</script>

<style lang="scss" scoped>
.menu-item-wrapper {
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 0.845rem;
  font-weight: 500;
  text-decoration: none;
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
  text-align: start;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover:not(.disabled) {
    background: var(--bg-page);
    color: var(--text-primary);
  }

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
}

:deep(.router-link-exact-active) {
  &.nav-item {
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 600;

    .nav-icon {
      background: var(--primary-mid);
    }
  }
}

.nav-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
  transition: background 0.15s;
}

.nav-label {
  flex: 1;
  transition: opacity 0.2s;
}

.nav-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
  background: var(--secondary);
  color: #fff;
  flex-shrink: 0;
  transition:
    opacity 0.2s,
    width 0.2s;

  &.primary {
    background: var(--secondary);
  }
  &.success {
    background: #10b981;
  }
  &.warning {
    background: #f59e0b;
    color: #1c1c1c;
  }
  &.danger {
    background: #ef4444;
  }
  &.info {
    background: #3b82f6;
  }
}

.chevron {
  display: flex;
  align-items: center;
  color: var(--border-color);
  flex-shrink: 0;
  transition:
    transform 0.25s ease,
    opacity 0.2s;

  &.rotated {
    transform: rotate(180deg);
    color: var(--primary);
  }
}

.submenu {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 2px;
}

.submenu-enter-active,
.submenu-leave-active {
  transition:
    max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease;
  max-height: 400px;
  overflow: hidden;
}
.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
