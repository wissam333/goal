<template>
  <div
    class="stats-grid"
    :class="{
      'cols-4': columns === 4,
      'cols-3': columns === 3,
      'cols-2': columns === 2,
    }"
  >
    <div
      v-for="stat in stats"
      :key="stat.key"
      class="stat-card"
      :class="[stat.color, { clickable: stat.clickable }]"
      @click="stat.clickable ? handleStatClick(stat) : null"
    >
      <div class="stat-content">
        <div class="stat-info">
          <span class="stat-label">{{ $t(stat.label) }}</span>
          <span class="stat-value">{{ formatValue(stat) }}</span>
          <span
            v-if="stat.trend"
            class="stat-trend"
            :class="stat.trend.direction"
          >
            <Icon :name="trendIcon(stat.trend.direction)" />
            {{ stat.trend.value }}%
          </span>
        </div>
        <div class="stat-icon-wrapper" :class="stat.color">
          <Icon :name="stat.icon" :size="iconSize" />
        </div>
      </div>
      <div v-if="stat.description" class="stat-description">
        {{ stat.description }}
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  stats: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.every(
        (stat) => stat.key && stat.label && stat.value !== undefined,
      );
    },
  },
  columns: {
    type: Number,
    default: 4,
    validator: (value) => [2, 3, 4].includes(value),
  },
  iconSize: {
    type: Number,
    default: 28,
  },
  formatNumber: {
    type: Function,
    default: (value) => {
      if (typeof value === "number") {
        return value.toLocaleString();
      }
      return value;
    },
  },
});

const emit = defineEmits(["stat-click"]);

const trendIcon = (direction) => {
  return direction === "up" ? "mdi:trending-up" : "mdi:trending-down";
};

const formatValue = (stat) => {
  if (stat.formatter) {
    return stat.formatter(stat.value);
  }
  return props.formatNumber(stat.value);
};

const handleStatClick = (stat) => {
  emit("stat-click", stat);
};
</script>

<style scoped lang="scss">
.stats-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;

  &.cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }
  &.cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
  &.cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 992px) {
    gap: 1.25rem;
    &.cols-4 {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    gap: 1rem;
    &.cols-4,
    &.cols-3 {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 576px) {
    gap: 0.875rem;
    margin-bottom: 1.5rem;
    &.cols-4,
    &.cols-3,
    &.cols-2 {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 375px) {
    gap: 0.75rem;
  }
}

.stat-card {
  background: var(--bg-surface);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;

  &.clickable {
    cursor: pointer;
    &:active {
      transform: scale(0.98);
      background-color: var(--bg-elevated);
    }
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }

  .stat-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .stat-info {
    flex: 1;
    min-width: 0;

    .stat-label {
      display: block;
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stat-value {
      display: block;
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
      margin-bottom: 0.5rem;
      word-break: break-word;
    }

    .stat-trend {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;

      &.up {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
      }

      &.down {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      svg {
        font-size: 1rem;
      }
    }
  }

  .stat-icon-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.primary {
      background: rgba(37, 99, 235, 0.1);
      color: #2563eb;
    }
    &.success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }
    &.warning {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }
    &.danger {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    &.info {
      background: rgba(6, 182, 212, 0.1);
      color: #06b6d4;
    }
  }

  .stat-description {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    color: var(--text-sub);
    font-size: 0.8125rem;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    .stat-value {
      font-size: 1rem;
    }
    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      :deep(svg) {
        width: 24px;
        height: 24px;
      }
    }
  }

  @media (max-width: 576px) {
    padding: 1rem;
    border-radius: 14px;

    .stat-value {
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }
    .stat-label {
      font-size: 0.8125rem;
      margin-bottom: 0.25rem;
    }
    .stat-icon-wrapper {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      :deep(svg) {
        width: 22px;
        height: 22px;
      }
    }
    .stat-trend {
      padding: 0.2rem 0.4rem;
      font-size: 0.6875rem;
    }
    .stat-description {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      font-size: 0.75rem;
    }
  }

  @media (max-width: 375px) {
    padding: 0.875rem;
    .stat-content {
      gap: 0.75rem;
    }
    .stat-value {
      font-size: 1rem;
    }
    .stat-icon-wrapper {
      width: 38px;
      height: 38px;
      :deep(svg) {
        width: 20px;
        height: 20px;
      }
    }
  }
}

@media (max-width: 576px) {
  .stats-grid:not(.cols-1) {
    &.cols-2,
    &.cols-3,
    &.cols-4 {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      gap: 0.875rem;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        height: 4px;
      }
      &::-webkit-scrollbar-track {
        background: var(--bg-elevated);
        border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 4px;
        &:hover {
          background: var(--text-muted);
        }
      }

      .stat-card {
        flex: 0 0 280px;
        scroll-snap-align: start;
        margin-bottom: 0.25rem;
      }
    }
  }
}

.stats-grid-alt {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
}
</style>
