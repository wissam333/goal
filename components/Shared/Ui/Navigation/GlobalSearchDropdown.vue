<!-- components/shared/ui/navigation/GlobalSearchDropdown.vue -->
<template>
  <Transition name="search-drop">
    <div v-if="show && query" class="search-dropdown" @mousedown.prevent>
      <!-- No results -->
      <div v-if="results.length === 0" class="search-empty">
        <Icon name="mdi:magnify-close" size="20" />
        <span>{{ $t("noResults") }}</span>
      </div>

      <!-- Grouped results -->
      <template v-else>
        <template v-for="group in grouped" :key="group.name">
          <div class="search-group-label">{{ group.name }}</div>
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="search-item"
            :class="{ active: highlighted === item.to }"
            @click="$emit('select')"
            @mouseenter="highlighted = item.to"
          >
            <div class="search-item-icon">
              <Icon :name="item.icon" size="16" />
            </div>
            <div class="search-item-text">
              <span
                class="search-item-label"
                v-html="highlight(displayLabel(item), query)"
              />
              <span class="search-item-path">{{ item.to }}</span>
            </div>
            <Icon
              name="mdi:arrow-top-left"
              size="13"
              class="search-item-arrow"
            />
          </NuxtLink>
        </template>
      </template>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps({
  show: { type: Boolean, required: true },
  query: { type: String, required: true },
  results: { type: Array, default: () => [] },
});

const emit = defineEmits(["select"]);

const { locale } = useI18n();
const highlighted = ref("");

const displayLabel = (item) => {
  return locale.value === "ar" && item.labelAr ? item.labelAr : item.label;
};

const grouped = computed(() => {
  const map = {};
  for (const item of props.results) {
    if (!map[item.group]) map[item.group] = [];
    map[item.group].push(item);
  }
  return Object.entries(map).map(([name, items]) => ({ name, items }));
});

const highlight = (text, query) => {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
};
</script>

<style lang="scss" scoped>
.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  min-width: 320px;
  max-height: 400px;
  overflow-y: auto;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.14);
  z-index: 2000;
  padding: 6px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.search-group-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  padding: 10px 10px 4px;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  text-decoration: none;
  color: var(--text-primary);
  transition: background 0.12s;
  cursor: pointer;

  &:hover,
  &.active {
    background: var(--bg-page);
  }
}

.search-item-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-item-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.search-item-label {
  font-size: 0.845rem;
  font-weight: 500;
  color: var(--text-primary);

  :deep(mark) {
    background: var(--primary-soft);
    color: var(--primary);
    border-radius: 3px;
    padding: 0 2px;
    font-weight: 700;
  }
}

.search-item-path {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-item-arrow {
  color: var(--text-muted);
  opacity: 0;
  flex-shrink: 0;
  transition: opacity 0.12s;

  .search-item:hover & {
    opacity: 1;
  }
}

.search-drop-enter-active,
.search-drop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.search-drop-enter-from,
.search-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
