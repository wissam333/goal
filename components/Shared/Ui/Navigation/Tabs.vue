<!-- components/shared/Ui/Navigation/Tabs.vue -->
<template>
  <div class="tabs-wrapper" :class="{ vertical }">
    <!-- Tab List -->
    <div
      class="tabs-list"
      :class="[
        `tabs-${variant}`,
        `tabs-${size}`,
        { 'tabs-scrollable': scrollable },
      ]"
      role="tablist"
    >
      <button
        v-for="tab in normalizedTabs"
        :key="tab.value"
        class="tab-item"
        :class="{
          active: isActive(tab.value),
          disabled: tab.disabled,
        }"
        :role="'tab'"
        :aria-selected="isActive(tab.value)"
        :aria-disabled="tab.disabled"
        :disabled="tab.disabled"
        @click.prevent="selectTab(tab.value)"
      >
        <Icon v-if="tab.icon" :name="tab.icon" class="tab-icon" />
        <span class="tab-label">{{ $t(tab.label) }}</span>
        <span
          v-if="tab.badge !== undefined"
          class="tab-badge"
          :class="tab.badgeVariant"
        >
          {{ tab.badge }}
        </span>
      </button>

      <!-- Active Indicator (for horizontal) -->
      <div
        v-if="!vertical && variant === 'default'"
        class="tab-indicator"
        :style="indicatorStyle"
      ></div>
    </div>

    <!-- Tab Panels -->
    <div class="tabs-panels">
      <slot :activeTab="activeValue">
        <div
          v-for="tab in normalizedTabs"
          v-show="isActive(tab.value)"
          :key="tab.value"
          class="tab-panel"
          :role="'tabpanel'"
          :aria-labelledby="`tab-${tab.value}`"
        >
          <slot :name="`tab-${tab.value}`" :tab="tab">
            {{ tab.content }}
          </slot>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  tabs: {
    type: Array,
    required: true,
    validator: (value) =>
      value.every((tab) => tab.label && tab.value !== undefined),
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "pills", "underlined"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  vertical: {
    type: Boolean,
    default: false,
  },
  scrollable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const { locale } = useI18n();
const tabsListRef = ref(null);
const activeTabRef = ref(null);

// Normalize tabs (handle both array of strings and objects)
const normalizedTabs = computed(() => {
  return props.tabs.map((tab) => {
    if (typeof tab === "string") {
      return { label: tab, value: tab.toLowerCase() };
    }
    return tab;
  });
});

// Set initial active tab
const activeValue = computed({
  get: () => {
    if (props.modelValue) return props.modelValue;
    return normalizedTabs.value[0]?.value;
  },
  set: (value) => {
    emit("update:modelValue", value);
    emit("change", value);
  },
});

// Check if tab is active
const isActive = (value) => activeValue.value === value;

// Select tab
const selectTab = (value) => {
  const tab = normalizedTabs.value.find((t) => t.value === value);
  if (tab && !tab.disabled) {
    activeValue.value = value;
  }
};

// Indicator position (for horizontal default variant)
const indicatorStyle = computed(() => {
  if (props.vertical || props.variant !== "default") return {};

  const activeIndex = normalizedTabs.value.findIndex(
    (tab) => tab.value === activeValue.value,
  );

  if (activeIndex === -1 || !tabsListRef.value) return {};

  const tabs = tabsListRef.value.querySelectorAll(".tab-item");
  const activeTab = tabs[activeIndex];

  if (!activeTab) return {};

  const { offsetLeft, offsetWidth } = activeTab;

  return {
    transform: `translateX(${offsetLeft}px)`,
    width: `${offsetWidth}px`,
  };
});

// Watch for active tab changes to scroll into view
watch(activeValue, () => {
  if (props.scrollable) {
    nextTick(() => {
      const activeTab = tabsListRef.value?.querySelector(".tab-item.active");
      if (activeTab) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    });
  }
});
</script>

<style scoped lang="scss">
.tabs-wrapper {
  width: 100%;

  &.vertical {
    display: flex;
    gap: 1.5rem;

    .tabs-list {
      flex-direction: column;
      min-width: 200px;
      border-bottom: none;
      border-inline-end: 2px solid var(--border-color);

      .tab-item {
        justify-content: flex-start;
        width: 100%;
        margin-bottom: 0.25rem;
        border-radius: 8px;
      }
    }

    .tabs-panels {
      flex: 1;
    }
  }
}

.tabs-list {
  display: flex;
  position: relative;
  border-bottom: 2px solid var(--border-color);

  &.tabs-scrollable {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-track {
      background: var(--bg-elevated);
    }

    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 4px;
    }

    .tab-item {
      flex-shrink: 0;
    }
  }

  &.tabs-pills {
    border-bottom: none;
    gap: 0.5rem;

    .tab-item {
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.5rem 1rem;

      &.active {
        background: var(--primary);
        color: #fff;
        border-color: var(--primary);
      }
    }
  }

  &.tabs-underlined {
    border-bottom: 2px solid var(--border-color);

    .tab-item {
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;

      &.active {
        border-bottom-color: var(--primary);
        color: var(--primary);
      }
    }
  }

  &.tabs-sm {
    .tab-item {
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
    }
  }

  &.tabs-md {
    .tab-item {
      padding: 0.75rem 1.25rem;
      font-size: 0.875rem;
    }
  }

  &.tabs-lg {
    .tab-item {
      padding: 1rem 1.5rem;
      font-size: 1rem;
    }
  }
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  white-space: nowrap;

  &:hover:not(.disabled) {
    color: var(--text-primary);
  }

  &.active {
    color: var(--text-primary);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tab-icon {
    font-size: 1.25rem;
  }

  .tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 0.375rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-inline-start: 0.25rem;

    &.primary {
      background: var(--primary);
      color: #fff;
    }

    &.success {
      background: #10b981;
      color: #fff;
    }

    &.warning {
      background: #f59e0b;
      color: #fff;
    }

    &.danger {
      background: #ef4444;
      color: #fff;
    }
  }
}

.tab-indicator {
  position: absolute;
  bottom: -2px;
  inset-inline-start: 0;
  height: 2px;
  background: var(--primary);
  transition:
    transform 0.3s ease,
    width 0.3s ease;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .tabs-wrapper.vertical {
    flex-direction: column;

    .tabs-list {
      flex-direction: row;
      min-width: auto;
      border-inline-end: none;
      border-bottom: 2px solid var(--border-color);
      overflow-x: auto;
    }
  }
}
</style>
