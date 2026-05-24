<template>
  <div class="filters-wrapper">
    <!-- Mobile Filter Toggle -->
    <div class="d-block d-md-none mb-3">
      <button class="filter-toggle-btn" @click="toggleMobileFilters">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <Icon name="mdi:filter" />
            <span>{{ $t("filters") }}</span>
            <span v-if="activeFilterCount > 0" class="badge bg-primary">
              {{ activeFilterCount }}
            </span>
          </div>
          <Icon
            :name="showMobileFilters ? 'mdi:chevron-up' : 'mdi:chevron-down'"
          />
        </div>
      </button>
    </div>

    <!-- Filters Content -->
    <div class="filters-content" :class="{ 'mobile-open': showMobileFilters }">
      <div class="filters-grid">
        <!-- Search Input -->
        <div class="filter-item search-item" v-if="showSearch">
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0">
              <Icon name="mdi:magnify" class="text-muted" />
            </span>
            <input
              :value="modelValue.search"
              @input="updateSearch($event.target.value)"
              type="text"
              class="form-control border-start-0"
              :placeholder="$t('searchPlaceholder')"
            />
            <button
              v-if="modelValue.search"
              class="btn btn-outline-secondary border-start-0"
              @click="clearSearch"
            >
              <Icon name="mdi:close" />
            </button>
          </div>
        </div>

        <!-- Dynamic Filter Fields -->
        <div v-for="filter in filters" :key="filter.key" class="filter-item">
          <label class="filter-label">{{ $t(filter.label) }}</label>

          <!-- Select Input -->
          <select
            v-if="filter.type === 'select'"
            :value="modelValue[filter.key]"
            @change="updateFilter(filter.key, $event.target.value)"
            class="form-select"
          >
            <option value="">{{ $t(filter.placeholder || "all") }}</option>
            <option
              v-for="option in filter.options"
              :key="option.value"
              :value="option.value"
            >
              {{ $t(option.label) }}
            </option>
          </select>

          <!-- Date Range Select -->
          <select
            v-else-if="filter.type === 'dateRange'"
            :value="modelValue[filter.key]"
            @change="updateFilter(filter.key, $event.target.value)"
            class="form-select"
          >
            <option value="">{{ $t("allDates") }}</option>
            <option value="today">{{ $t("today") }}</option>
            <option value="week">{{ $t("thisWeek") }}</option>
            <option value="month">{{ $t("thisMonth") }}</option>
            <option value="year">{{ $t("thisYear") }}</option>
          </select>

          <!-- Custom Input -->
          <input
            v-else-if="filter.type === 'input'"
            :type="filter.inputType || 'text'"
            :value="modelValue[filter.key]"
            @input="updateFilter(filter.key, $event.target.value)"
            class="form-control"
            :placeholder="$t(filter.placeholder)"
          />
        </div>

        <!-- Action Buttons -->
        <div class="filter-actions">
          <!-- <button
            class="btn btn-primary"
            @click="applyFilters"
            :disabled="!hasChanges"
          >
            <Icon name="mdi:filter-check" class="me-1" />
            {{ $t("apply") }}
          </button> -->
          <button
            class="btn btn-outline-secondary"
            @click="resetFilters"
            :disabled="!hasActiveFilters"
          >
            <Icon name="mdi:filter-remove" class="me-1" />
            {{ $t("reset") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  filters: {
    type: Array,
    default: () => [],
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  debounceTime: {
    type: Number,
    default: 300,
  },
});

const emit = defineEmits(["update:modelValue", "apply", "reset"]);

const showMobileFilters = ref(false);
const localFilters = ref({ ...props.modelValue });
let debounceTimer = null;

// Computed
const activeFilterCount = computed(() => {
  return Object.values(localFilters.value).filter((v) => v && v !== "").length;
});

const hasActiveFilters = computed(() => activeFilterCount.value > 0);

const hasChanges = computed(() => {
  return (
    JSON.stringify(localFilters.value) !== JSON.stringify(props.modelValue)
  );
});

// Methods
const toggleMobileFilters = () => {
  showMobileFilters.value = !showMobileFilters.value;
};

const updateFilter = (key, value) => {
  localFilters.value = {
    ...localFilters.value,
    [key]: value,
  };

  // Emit changes with debounce
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emit("update:modelValue", localFilters.value);
    emit("apply", localFilters.value);
  }, props.debounceTime);
};

const updateSearch = (value) => {
  updateFilter("search", value);
};

const clearSearch = () => {
  updateFilter("search", "");
};

const applyFilters = () => {
  emit("update:modelValue", localFilters.value);
  emit("apply", localFilters.value);
  showMobileFilters.value = false;
};

const resetFilters = () => {
  const resetValues = {};
  Object.keys(localFilters.value).forEach((key) => {
    resetValues[key] = "";
  });
  localFilters.value = resetValues;
  emit("update:modelValue", resetValues);
  emit("reset");
  emit("apply", resetValues);
};

// Watch for external changes
watch(
  () => props.modelValue,
  (newVal) => {
    localFilters.value = { ...newVal };
  },
  { deep: true },
);
</script>

<style scoped lang="scss">
.filters-wrapper {
  background: var(--bg-surface);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
}

.filter-toggle-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-elevated);
    border-color: var(--primary);
  }

  .badge {
    background: var(--primary);
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
}

.filters-content {
  @media (max-width: 768px) {
    display: none;

    &.mobile-open {
      display: block;
      margin-top: 1rem;
    }
  }
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.filter-item {
  .filter-label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-sub);
    margin-bottom: 0.375rem;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  &.search-item {
    @media (min-width: 768px) {
      grid-column: span 2;
    }
  }
}

.form-control,
.form-select {
  height: 42px;
  border-color: var(--border-color);
  border-radius: 10px;
  font-size: 0.875rem;
  background-color: var(--bg-surface);
  color: var(--text-primary);

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 0.2rem var(--primary-soft);
    background-color: var(--bg-surface);
    color: var(--text-primary);
  }
}

.input-group {
  .input-group-text {
    border-color: var(--border-color);
    background-color: var(--bg-surface);
    color: var(--text-muted);
    border-start-start-radius: 10px;
    border-end-start-radius: 10px;
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }

  .form-control {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
    border-start-end-radius: 10px;
    border-end-end-radius: 10px;
  }
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  .btn {
    flex: 1;
    height: 42px;
    border-radius: 10px;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &.btn-primary {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;

      &:hover:not(:disabled) {
        background: var(--primary);
        border-color: var(--primary);
        filter: brightness(1.1);
      }

      &:disabled {
        opacity: 0.5;
      }
    }
  }
}
</style>
