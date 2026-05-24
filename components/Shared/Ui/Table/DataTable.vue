<template>
  <div class="data-table-wrapper" :dir="direction">
    <!-- Table Header with Title -->
    <div v-if="title || $slots.header" class="table-header-section">
      <slot name="header">
        <div class="d-flex align-items-center gap-2">
          <Icon v-if="icon" :name="icon" class="header-icon" />
          <div>
            <h5 class="header-title">{{ $t(title) }}</h5>
            <p v-if="subtitle" class="header-subtitle">{{ $t(subtitle) }}</p>
          </div>
        </div>
      </slot>
    </div>

    <!-- Mobile Cards View -->
    <div v-if="isMobile" class="mobile-cards-view">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state mobile-loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ $t("loading") }}</span>
        </div>
        <p class="mt-3">{{ $t(loadingText) }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!data.length" class="empty-state mobile-empty">
        <Icon :name="emptyIcon" class="empty-icon" />
        <h6>{{ $t(emptyText) }}</h6>
        <p v-if="emptyDescription">{{ $t(emptyDescription) }}</p>
        <button
          v-if="emptyAction"
          class="btn btn-sm btn-primary mt-3"
          @click="emptyAction.handler"
        >
          {{ $t(emptyAction.label) }}
        </button>
      </div>

      <!-- Cards -->
      <div v-else class="cards-container">
        <div
          v-for="(row, index) in data"
          :key="getRowKey(row, index)"
          class="data-card"
          :class="{ clickable: rowClickable }"
          @click="rowClickable ? handleRowClick(row) : null"
        >
          <!-- Card Header - First column as title + status -->
          <div class="card-header">
            <div class="card-title">
              <slot
                :name="`cell-${columns[0]?.key}`"
                :row="row"
                :value="getNestedValue(row, columns[0]?.key)"
              >
                <span class="title-text">
                  {{ formatCellValue(row, columns[0]) }}
                </span>
              </slot>
            </div>

            <!-- Status Badge if status column exists -->
            <div v-if="hasStatusColumn" class="card-status">
              <slot
                :name="`cell-${statusColumn.key}`"
                :row="row"
                :value="getNestedValue(row, statusColumn.key)"
              >
                <span
                  class="status-badge"
                  :class="
                    getStatusBadgeClass(getNestedValue(row, statusColumn.key))
                  "
                >
                  {{ getStatusText(getNestedValue(row, statusColumn.key)) }}
                </span>
              </slot>
            </div>
          </div>

          <!-- Card Body - All other columns -->
          <div class="card-body">
            <div v-for="col in bodyColumns" :key="col.key" class="card-row">
              <div class="row-label">
                <Icon
                  v-if="col.icon"
                  :name="col.icon"
                  size="14"
                  class="label-icon"
                />
                <span>{{ $t(col.label) }}</span>
              </div>
              <div class="row-value" :class="col.align">
                <slot
                  :name="`cell-${col.key}`"
                  :row="row"
                  :value="getNestedValue(row, col.key)"
                >
                  {{ formatCellValue(row, col) }}
                </slot>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="$slots.actions || actions.length" class="card-actions">
              <slot name="actions" :row="row">
                <div class="action-buttons">
                  <button
                    v-for="action in actions"
                    :key="action.key"
                    class="action-btn"
                    :class="action.class"
                    :title="$t(action.label)"
                    @click.stop="handleAction(action, row)"
                  >
                    <Icon :name="action.icon" />
                    <span class="action-text d-none d-sm-inline">{{
                      $t(action.label)
                    }}</span>
                  </button>
                </div>
              </slot>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <SharedUiTableBasePagination
        v-if="pagination && pagination.totalItems > 0"
        :current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        :total-items="pagination.totalItems"
        :show-page-size="showPageSize"
        :page-size-options="pageSizeOptions"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
        class="mt-4"
      />
    </div>

    <!-- Desktop Table View -->
    <div v-else class="table-container" :class="{ 'table-loading': loading }">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :class="[
                  column.align ? `text-${column.align}` : 'text-start',
                  { sortable: column.sortable },
                ]"
                :style="{ width: column.width }"
              >
                <div
                  class="th-content"
                  @click="column.sortable ? handleSort(column.key) : null"
                >
                  <span>{{ $t(column.label) }}</span>
                  <span v-if="column.sortable" class="sort-icon">
                    <Icon
                      :name="getSortIcon(column.key)"
                      :class="{ active: sortField === column.key }"
                    />
                  </span>
                </div>
              </th>
              <th
                v-if="$slots.actions || actions.length"
                class="actions-header"
              >
                {{ $t("actions") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading State -->
            <tr v-if="loading" class="loading-row">
              <td :colspan="columnCount">
                <div class="loading-state">
                  <div class="spinner"></div>
                  <p>{{ $t(loadingText) }}</p>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="!data.length" class="empty-row">
              <td :colspan="columnCount">
                <div class="empty-state">
                  <Icon :name="emptyIcon" class="empty-icon" />
                  <h6>{{ $t(emptyText) }}</h6>
                  <p v-if="emptyDescription">{{ $t(emptyDescription) }}</p>
                  <button
                    v-if="emptyAction"
                    class="btn btn-sm btn-primary mt-3"
                    @click="emptyAction.handler"
                  >
                    {{ $t(emptyAction.label) }}
                  </button>
                </div>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr
              v-else
              v-for="(row, index) in data"
              :key="getRowKey(row, index)"
              class="data-row"
              :class="{ clickable: rowClickable }"
              @click="rowClickable ? handleRowClick(row) : null"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                :class="column.align ? `text-${column.align}` : 'text-start'"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :row="row"
                  :value="getNestedValue(row, column.key)"
                >
                  {{ formatCellValue(row, column) }}
                </slot>
              </td>

              <!-- Actions -->
              <td v-if="$slots.actions || actions.length" class="actions-cell">
                <slot name="actions" :row="row">
                  <div class="action-buttons">
                    <button
                      v-for="action in actions"
                      :key="action.key"
                      class="action-btn"
                      :class="action.class"
                      :title="$t(action.label)"
                      :disabled="isActionLoading(action, row, index)"
                      @click.stop="handleAction(action, row, index)"
                    >
                      <!-- Spinner or Icon -->
                      <span
                        v-if="isActionLoading(action, row, index)"
                        class="action-spinner"
                      />
                      <Icon v-else :name="action.icon" />
                    </button>
                  </div>
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <SharedUiTableBasePagination
        v-if="pagination && pagination.totalItems > 0"
        :current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        :total-items="pagination.totalItems"
        :show-page-size="showPageSize"
        :page-size-options="pageSizeOptions"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  subtitle: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "",
  },
  rowClickable: {
    type: Boolean,
    default: false,
  },
  actions: {
    type: Array,
    default: () => [],
  },
  pagination: {
    type: Object,
    default: null,
  },
  sortField: {
    type: String,
    default: "",
  },
  sortDirection: {
    type: String,
    default: "desc",
  },
  showPageSize: {
    type: Boolean,
    default: true,
  },
  pageSizeOptions: {
    type: Array,
    default: () => [5, 10, 20, 50, 100],
  },
  loadingText: {
    type: String,
    default: "loading",
  },
  emptyText: {
    type: String,
    default: "noData",
  },
  emptyDescription: {
    type: String,
    default: "",
  },
  emptyIcon: {
    type: String,
    default: "mdi:database-remove",
  },
  emptyAction: {
    type: Object,
    default: null,
  },
  mobileBreakpoint: {
    type: Number,
    default: 768,
  },
  statusColumnKey: {
    type: String,
    default: "status",
  },
  // Columns to hide on mobile
  mobileHiddenColumns: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "row-click",
  "action-click",
  "page-change",
  "page-size-change",
  "sort-change",
]);

const { locale } = useI18n();
const slots = useSlots();

// Mobile detection
const isMobile = ref(false);
const direction = computed(() => (locale.value === "ar" ? "rtl" : "ltr"));

const checkMobile = () => {
  if (process.client) {
    isMobile.value = window.innerWidth <= props.mobileBreakpoint;
  }
};

const loadingActions = ref({});
const isActionLoading = (action, row, index) => {
  const key = `${getRowKey(row, index)}-${action.key}`;
  return !!loadingActions.value[key];
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkMobile);
});

// Computed
const columnCount = computed(() => {
  let count = props.columns.length;
  if (props.actions.length || slots.actions) count++;
  return count;
});

// Find status column
const statusColumn = computed(() => {
  return props.columns.find((col) => col.key === props.statusColumnKey);
});

const hasStatusColumn = computed(() => !!statusColumn.value);

// Columns for mobile body (exclude first column and status column)
const bodyColumns = computed(() => {
  return props.columns.filter((col, index) => {
    // Skip first column (it's in header)
    if (index === 0) return false;
    // Skip status column (it's in header)
    if (col.key === props.statusColumnKey) return false;
    // Skip hidden columns
    if (props.mobileHiddenColumns.includes(col.key)) return false;
    return true;
  });
});

// Helper Methods
const getNestedValue = (obj, path) => {
  if (!path) return null;
  return path.split(".").reduce((current, key) => current?.[key], obj);
};

const formatCellValue = (row, column) => {
  if (!column) return "---";

  const value = getNestedValue(row, column.key);

  if (value === null || value === undefined) return "---";

  if (column.formatter) {
    return column.formatter(value);
  }

  switch (column.type) {
    case "date":
      return formatDate(value, column.dateFormat);
    case "currency":
      return formatCurrency(value, column.currency);
    case "badge":
      return value;
    default:
      return value;
  }
};

const formatDate = (value, format = "short") => {
  if (!value) return "---";
  const date = new Date(value);

  if (format === "short") {
    return date.toLocaleDateString(locale.value, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } else if (format === "long") {
    return date.toLocaleDateString(locale.value, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString();
};

const formatCurrency = (value, currency = "SDG") => {
  if (!value && value !== 0) return "---";
  return new Intl.NumberFormat(locale.value, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const getStatusBadgeClass = (status) => {
  const statusMap = {
    Paid: "status-paid",
    Accepted: "status-accepted",
    Confirmed: "status-accepted",
    Pending: "status-pending",
    Overdue: "status-overdue",
    Cancelled: "status-cancelled",
    Canceled: "status-cancelled",
    Rejected: "status-cancelled",
    Completed: "status-completed",
  };

  return statusMap[status] || "status-pending";
};

const getStatusText = (status) => {
  const statusMap = {
    Paid: "مدفوع",
    Accepted: "مقبول",
    Confirmed: "مؤكد",
    Pending: "معلق",
    Overdue: "متأخر",
    Cancelled: "ملغي",
    Canceled: "ملغي",
    Rejected: "مرفوض",
    Completed: "مكتمل",
  };

  return statusMap[status] || status;
};

const getSortIcon = (columnKey) => {
  if (props.sortField !== columnKey) return "mdi:unfold-more-horizontal";
  return props.sortDirection === "asc"
    ? "mdi:sort-ascending"
    : "mdi:sort-descending";
};

const handleSort = (columnKey) => {
  let direction = "asc";

  if (props.sortField === columnKey) {
    direction = props.sortDirection === "asc" ? "desc" : "asc";
  }

  emit("sort-change", { field: columnKey, direction });
};

const handleRowClick = (row) => {
  emit("row-click", row);
};

// Update handleAction to expose the loading state setter
const handleAction = (action, row, index) => {
  const key = `${getRowKey(row, index)}-${action.key}`;

  const setLoading = (val) => {
    loadingActions.value = { ...loadingActions.value, [key]: val };
  };

  emit("action-click", { action, row, setLoading });
};

const handlePageChange = (page) => {
  emit("page-change", page);
};

const handlePageSizeChange = (pageSize) => {
  emit("page-size-change", pageSize);
};

const getRowKey = (row, index) => {
  return row.id || row.invoiceNumber || index;
};
</script>

<style scoped lang="scss">
.data-table-wrapper {
  background: var(--bg-surface);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-header-section {
  padding: 1.5rem 1.5rem 0.5rem;

  .header-icon {
    font-size: 1.75rem;
    color: var(--primary);
  }

  .header-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .header-subtitle {
    font-size: 0.875rem;
    color: var(--text-sub);
    margin: 0.25rem 0 0;
  }
}

/* Desktop Table Styles */
.table-container {
  position: relative;

  &.table-loading {
    min-height: 200px;
  }
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--bg-elevated);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;

    &:hover {
      background: var(--text-muted);
    }
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: var(--bg-elevated);
    border-bottom: 2px solid var(--primary);

    th {
      padding: 1rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary);
      white-space: nowrap;

      .th-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      &.sortable {
        .th-content {
          cursor: pointer;

          &:hover {
            color: var(--primary);
          }
        }
      }

      .sort-icon {
        display: inline-flex;
        color: var(--text-muted);

        .active {
          color: var(--primary);
        }
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid var(--border-color);
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--bg-elevated);
      }

      &.clickable {
        cursor: pointer;
      }
    }

    td {
      padding: 1rem;
      font-size: 0.875rem;
      color: var(--text-sub);
    }
  }
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner-border {
    width: 3rem;
    height: 3rem;
    color: var(--primary);
  }

  p {
    color: var(--text-sub);
    margin: 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;

  .empty-icon {
    font-size: 3rem;
    color: var(--border-color);
    margin-bottom: 1rem;
  }

  h6 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--text-sub);
    font-size: 0.875rem;
    margin: 0;
  }
}

/* Actions */
.actions-header {
  text-align: center;
  width: 100px;
}

.actions-cell {
  text-align: center;

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: center;

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      cursor: pointer;

      &:hover {
        background: var(--bg-elevated);
        color: var(--text-primary);
      }

      &.btn-primary {
        background: rgba(37, 99, 235, 0.1);
        color: #2563eb;
        &:hover {
          background: #2563eb;
          color: #fff;
        }
      }
      &.btn-warning {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        &:hover {
          background: #f59e0b;
          color: #fff;
        }
      }
      &.btn-info {
        background: rgba(6, 182, 212, 0.1);
        color: #06b6d4;
        &:hover {
          background: #06b6d4;
          color: #fff;
        }
      }
      &.btn-success {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        &:hover {
          background: #10b981;
          color: #fff;
        }
      }
      &.btn-danger {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        &:hover {
          background: #ef4444;
          color: #fff;
        }
      }
    }
  }
}

/* Mobile Cards View */
.mobile-cards-view {
  padding: 0rem;
  width: 100%;
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.data-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &.clickable {
    cursor: pointer;
    &:active {
      background-color: var(--bg-elevated);
      transform: scale(0.99);
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-color);

    .card-title {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 1rem;

      .title-text {
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .card-status {
      .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;

        &.status-pending {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        &.status-accepted {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        &.status-completed {
          background: rgba(6, 182, 212, 0.1);
          color: #06b6d4;
        }
        &.status-cancelled {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        &.status-overdue {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        &.status-paid {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
      }
    }
  }

  .card-body {
    padding: 16px;

    .card-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px dashed var(--border-color);

      &:last-child {
        border-bottom: none;
      }

      .row-label {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.75rem;
        color: var(--text-sub);
        text-transform: uppercase;
        letter-spacing: 0.5px;

        .label-icon {
          color: var(--text-muted);
        }
      }

      .row-value {
        font-size: 0.875rem;
        color: var(--text-primary);
        font-weight: 500;
        text-align: end;
        word-break: break-word;
        max-width: 60%;

        &.text-start {
          text-align: start;
        }
        &.text-center {
          text-align: center;
        }
        &.text-end {
          text-align: end;
        }
      }
    }

    .card-actions {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-muted);
          transition: all 0.2s;
          cursor: pointer;

          &:hover {
            background: var(--bg-elevated);
            color: var(--text-primary);
          }

          .action-text {
            font-size: 0.8125rem;
          }

          &.btn-primary {
            background: rgba(37, 99, 235, 0.1);
            color: #2563eb;
            &:hover {
              background: #2563eb;
              color: #fff;
            }
          }
          &.btn-success {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            &:hover {
              background: #10b981;
              color: #fff;
            }
          }
          &.btn-danger {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            &:hover {
              background: #ef4444;
              color: #fff;
            }
          }
        }
      }
    }
  }
}

/* Mobile Loading & Empty States */
.mobile-loading,
.mobile-empty {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .table-header-section {
    padding: 1rem;
    .header-title {
      font-size: 1.125rem;
    }
  }

  .data-card {
    .card-header {
      padding: 12px;
    }
    .card-body {
      padding: 12px;
      .card-row {
        .row-label {
          font-size: 0.7rem;
        }
        .row-value {
          font-size: 0.8rem;
          max-width: 55%;
        }
      }
    }
  }

  .action-btn {
    width: 36px;
    height: 36px;
    svg {
      width: 18px;
      height: 18px;
    }
  }
}

@media (max-width: 480px) {
  .data-card {
    .card-body {
      .card-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        .row-label {
          font-size: 0.65rem;
        }
        .row-value {
          font-size: 0.85rem;
          max-width: 100%;
          text-align: start;
        }
      }
    }

    .card-actions {
      .action-buttons {
        flex-wrap: wrap;
        gap: 6px;
        .action-btn {
          width: 40px;
          height: 40px;
          flex: 1 1 auto;
          min-width: 40px;
        }
      }
    }
  }
}

.action-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}
</style>
