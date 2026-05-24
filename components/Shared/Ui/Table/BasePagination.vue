<template>
  <div v-if="totalPages > 1" class="pagination-wrapper">
    <div class="pagination-container">
      <!-- Mobile View -->
      <div class="pagination-mobile d-sm-none">
        <div class="d-flex justify-content-between align-items-center">
          <button
            class="pagination-btn prev"
            :disabled="currentPage <= 1"
            @click="changePage(currentPage - 1)"
          >
            <Icon :name="prevIcon" />
            <!-- Use computed prop -->
            <span>{{ $t("previous") }}</span>
          </button>

          <div class="page-info">
            <span class="current">{{ currentPage }}</span>
            <span class="separator">/</span>
            <span class="total">{{ totalPages }}</span>
          </div>

          <button
            class="pagination-btn next"
            :disabled="currentPage >= totalPages"
            @click="changePage(currentPage + 1)"
          >
            <span>{{ $t("next") }}</span>
            <Icon :name="nextIcon" />
            <!-- Use computed prop -->
          </button>
        </div>
      </div>

      <!-- Desktop View -->
      <div class="pagination-desktop d-none d-sm-flex">
        <div class="pagination-info">
          <span class="showing">
            {{ $t("showing") }}
            <strong>{{ startItem }}</strong> - <strong>{{ endItem }}</strong>
            {{ $t("of") }} <strong>{{ totalItems }}</strong>
          </span>
        </div>

        <div class="pagination-controls">
          <!-- First Page -->
          <button
            class="pagination-btn first"
            :disabled="currentPage <= 1"
            @click="changePage(1)"
            :title="$t('firstPage')"
          >
            <Icon :name="firstPageIcon" />
            <!-- Add computed for double left -->
          </button>

          <!-- Previous -->
          <button
            class="pagination-btn prev"
            :disabled="currentPage <= 1"
            @click="changePage(currentPage - 1)"
            :title="$t('previousPage')"
          >
            <Icon :name="prevIcon" />
            <!-- Use computed prop -->
          </button>

          <!-- Page Numbers -->
          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              class="page-number"
              :class="{ active: page === currentPage }"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
          </div>

          <!-- Next -->
          <button
            class="pagination-btn next"
            :disabled="currentPage >= totalPages"
            @click="changePage(currentPage + 1)"
            :title="$t('nextPage')"
          >
            <Icon :name="nextIcon" />
            <!-- Use computed prop -->
          </button>

          <!-- Last Page -->
          <button
            class="pagination-btn last"
            :disabled="currentPage >= totalPages"
            @click="changePage(totalPages)"
            :title="$t('lastPage')"
          >
            <Icon :name="lastPageIcon" />
            <!-- Add computed for double right -->
          </button>
        </div>

        <!-- Page Size Selector -->
        <div class="page-size-selector" v-if="showPageSize">
          <select
            v-model="localPageSize"
            class="form-select form-select-sm"
            @change="handlePageSizeChange"
          >
            <option v-for="size in pageSizeOptions" :key="size" :value="size">
              {{ size }} / {{ $t("page") }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  pageSize: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  maxVisible: {
    type: Number,
    default: 5,
  },
  showPageSize: {
    type: Boolean,
    default: true,
  },
  pageSizeOptions: {
    type: Array,
    default: () => [5, 10, 20, 50, 100],
  },
});

const emit = defineEmits(["page-change", "page-size-change"]);

const { locale } = useI18n();

// Computed
const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize));

const startItem = computed(() =>
  props.totalItems === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1,
);

const endItem = computed(() =>
  Math.min(props.currentPage * props.pageSize, props.totalItems),
);

const visiblePages = computed(() => {
  if (totalPages.value === 0) return [];

  const pages = [];
  const half = Math.floor(props.maxVisible / 2);
  let start = Math.max(props.currentPage - half, 1);
  let end = Math.min(start + props.maxVisible - 1, totalPages.value);

  if (end - start + 1 < props.maxVisible) {
    start = Math.max(end - props.maxVisible + 1, 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Arrow icons that flip based on locale
const prevIcon = computed(() =>
  locale.value === "ar" ? "mdi:chevron-right" : "mdi:chevron-left",
);

const nextIcon = computed(() =>
  locale.value === "ar" ? "mdi:chevron-left" : "mdi:chevron-right",
);

const firstPageIcon = computed(() =>
  locale.value === "ar"
    ? "mdi:chevron-double-right"
    : "mdi:chevron-double-left",
);

const lastPageIcon = computed(() =>
  locale.value === "ar"
    ? "mdi:chevron-double-left"
    : "mdi:chevron-double-right",
);

// Local state
const localPageSize = ref(props.pageSize);

// Methods
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit("page-change", page);
  }
};

const handlePageSizeChange = () => {
  emit("page-size-change", localPageSize.value);
  emit("page-change", 1); // Reset to first page
};

// Watch for prop changes
watch(
  () => props.pageSize,
  (newVal) => {
    localPageSize.value = newVal;
  },
);
</script>

<style scoped lang="scss">
.pagination-wrapper {
  margin-top: 1.5rem;
}

.pagination-container {
  background: var(--bg-surface);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
}

/* Mobile Styles */
.pagination-mobile {
  .pagination-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    background: var(--bg-surface);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: var(--bg-elevated);
      border-color: var(--primary);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    svg {
      font-size: 1.25rem;
    }
  }

  .page-info {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: 600;

    .current {
      color: var(--text-primary);
      font-size: 1.125rem;
    }

    .separator {
      color: var(--text-muted);
    }

    .total {
      color: var(--text-sub);
    }
  }
}

/* Desktop Styles */
.pagination-desktop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;

  .pagination-info {
    .showing {
      color: var(--text-sub);
      font-size: 0.875rem;

      strong {
        color: var(--text-primary);
        font-weight: 600;
      }
    }
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;

    .pagination-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      border-radius: 8px;
      color: var(--text-sub);
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: var(--bg-elevated);
        border-color: var(--primary);
        color: var(--primary);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      svg {
        font-size: 1.25rem;
      }
    }

    .page-numbers {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin: 0 0.5rem;

      .page-number {
        min-width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid transparent;
        background: transparent;
        border-radius: 8px;
        color: var(--text-sub);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--bg-elevated);
          border-color: var(--border-color);
        }

        &.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }
      }
    }
  }

  .page-size-selector {
    select {
      width: auto;
      border-color: var(--border-color);
      border-radius: 8px;
      padding: 0.375rem 2rem 0.375rem 0.75rem;
      font-size: 0.875rem;
      background-color: var(--bg-surface);
      color: var(--text-primary);

      &:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 0.2rem var(--primary-soft);
        outline: none;
      }
    }
  }
}
</style>
