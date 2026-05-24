<!-- components/shared/Ui/Feedback/EmptyState.vue -->
<template>
  <div class="empty-state" :class="size">
    <div class="empty-state-content">
      <!-- Icon -->
      <div v-if="icon || $slots.icon" class="empty-state-icon">
        <slot name="icon">
          <Icon :name="icon" :size="iconSize" />
        </slot>
      </div>

      <!-- Title -->
      <h3 v-if="title" class="empty-state-title">
        {{ $t(title) }}
      </h3>

      <!-- Description -->
      <p v-if="description" class="empty-state-description">
        {{ $t(description) }}
      </p>

      <!-- Additional Content Slot -->
      <div v-if="$slots.default" class="empty-state-extra">
        <slot></slot>
      </div>

      <!-- Action Button -->
      <button
        v-if="actionLabel && actionHandler"
        class="empty-state-action"
        :class="{ 'btn-primary': actionVariant === 'primary' }"
        @click="actionHandler"
      >
        <Icon v-if="actionIcon" :name="actionIcon" class="me-1" />
        {{ $t(actionLabel) }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "mdi:database-remove",
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  actionLabel: {
    type: String,
    default: "",
  },
  actionIcon: {
    type: String,
    default: "",
  },
  actionVariant: {
    type: String,
    default: "primary",
    validator: (value) => ["primary", "secondary", "outline"].includes(value),
  },
  actionHandler: {
    type: Function,
    default: null,
  },
});

// Icon size based on component size
const iconSize = computed(() => {
  const sizes = {
    sm: 48,
    md: 64,
    lg: 80,
  };
  return sizes[props.size];
});
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  // ── Sizes ───────────────────────────────────────────────────────────────────
  &.sm {
    padding: 1.5rem;
    .empty-state-icon {
      margin-bottom: 1rem;
    }
    .empty-state-title {
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }
    .empty-state-description {
      font-size: 0.8125rem;
    }
  }

  &.md {
    padding: 2rem;
    .empty-state-icon {
      margin-bottom: 1.5rem;
    }
    .empty-state-title {
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
    }
    .empty-state-description {
      font-size: 0.875rem;
    }
  }

  &.lg {
    padding: 3rem;
    .empty-state-icon {
      margin-bottom: 2rem;
    }
    .empty-state-title {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    .empty-state-description {
      font-size: 1rem;
    }
  }

  // ── Content ─────────────────────────────────────────────────────────────────
  .empty-state-content {
    text-align: center;
    max-width: 400px;
    margin: 0 auto;
  }

  // ── Icon ────────────────────────────────────────────────────────────────────
  .empty-state-icon {
    color: var(--border-color); // ← was #dee2e6 — adapts dark/light

    :deep(svg) {
      width: v-bind(iconSize + "px");
      height: v-bind(iconSize + "px");
    }
  }

  // ── Text ────────────────────────────────────────────────────────────────────
  .empty-state-title {
    font-weight: 600;
    color: var(--text-primary); // ← was #2c3e50
    margin: 0;
  }

  .empty-state-description {
    color: var(--text-sub); // ← was #6c757d
    margin: 0;
    line-height: 1.6;
  }

  // ── Extra slot ──────────────────────────────────────────────────────────────
  .empty-state-extra {
    margin-top: 1.5rem;
  }

  // ── Action button ────────────────────────────────────────────────────────────
  .empty-state-action {
    margin-top: 1.5rem;
    padding: 0.625rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1.5px solid transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    &.btn-primary {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;

      &:hover {
        filter: brightness(0.88);
        transform: translateY(-1px);
      }
    }

    &.btn-secondary {
      background: var(--bg-elevated);
      border-color: var(--border-color);
      color: var(--text-primary);

      &:hover {
        border-color: var(--primary);
        color: var(--primary);
        transform: translateY(-1px);
      }
    }

    &.btn-outline {
      background: transparent;
      border-color: var(--primary);
      color: var(--primary);

      &:hover {
        background: var(--primary-soft);
        transform: translateY(-1px);
      }
    }

    &:active {
      transform: scale(0.96) !important;
    }
  }
}

// ── Mobile ────────────────────────────────────────────────────────────────────
@media (max-width: 768px) {
  .empty-state {
    padding: 1.5rem;

    &.lg {
      padding: 2rem;
    }

    .empty-state-icon {
      margin-bottom: 1rem;
      :deep(svg) {
        width: 48px;
        height: 48px;
      }
    }

    .empty-state-title {
      font-size: 1.125rem;
    }
    .empty-state-description {
      font-size: 0.875rem;
    }
  }
}
</style>
