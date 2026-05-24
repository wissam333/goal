<!-- components/shared/Ui/Feedback/Alert.vue -->
<template>
  <transition name="alert-fade">
    <div
      v-if="visible"
      class="alert"
      :class="[type, { dismissible }]"
      role="alert"
    >
      <div class="alert-content">
        <div class="alert-icon">
          <Icon :name="iconName" :size="20" />
        </div>

        <div class="alert-message">
          <h4 v-if="title" class="alert-title">{{ $t(title) }}</h4>
          <slot>
            <p v-if="message" class="alert-text">{{ $t(message) }}</p>
          </slot>
        </div>
      </div>

      <button
        v-if="dismissible"
        class="alert-close"
        @click="dismiss"
        :aria-label="$t('close')"
      >
        <Icon name="mdi:close" size="18" />
      </button>

      <div v-if="$slots.actions" class="alert-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: "info",
    validator: (value) =>
      ["success", "error", "warning", "info"].includes(value),
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
  dismissible: {
    type: Boolean,
    default: false,
  },
  duration: {
    type: Number,
    default: 0, // 0 means no auto-dismiss
  },
  modelValue: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "dismiss"]);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Icon mapping based on type
const iconName = computed(() => {
  const icons = {
    success: "mdi:check-circle",
    error: "mdi:alert-circle",
    warning: "mdi:alert",
    info: "mdi:information",
  };
  return icons[props.type];
});

// Auto-dismiss timer
let dismissTimer = null;

const dismiss = () => {
  visible.value = false;
  emit("dismiss");
};

watch(visible, (newVal) => {
  if (newVal && props.duration > 0) {
    dismissTimer = setTimeout(dismiss, props.duration);
  } else if (dismissTimer) {
    clearTimeout(dismissTimer);
  }
});

onUnmounted(() => {
  if (dismissTimer) clearTimeout(dismissTimer);
});
</script>

<style scoped lang="scss">
// ── Semantic color tokens (fixed — not theme-dependent) ───────────────────────
$types: (
  success: #10b981,
  error: #ef4444,
  warning: #f59e0b,
  info: #2563eb,
);

.alert {
  position: relative;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  display: flex;
  align-items: flex-start;
  gap: 1rem;

  // ── Type variants — generated ─────────────────────────────────────────────
  @each $name, $color in $types {
    &.#{$name} {
      background: rgba($color, 0.1);
      border-color: rgba($color, 0.25);
      color: $color;

      .alert-icon {
        color: $color;
      }
    }
  }

  &.dismissible {
    padding-inline-end: 3rem;
  } // ← handles both LTR & RTL

  // ── Content ───────────────────────────────────────────────────────────────
  .alert-content {
    flex: 1;
    display: flex;
    gap: 0.75rem;
    min-width: 0;
  }

  .alert-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .alert-message {
    flex: 1;
    min-width: 0;
  }

  .alert-title {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    color: inherit;
  }

  .alert-text {
    font-size: 0.875rem;
    margin: 0;
    color: var(--text-primary); // ← was hardcoded #2c3e50
    line-height: 1.6;
    opacity: 0.9;
  }

  // ── Close button ──────────────────────────────────────────────────────────
  .alert-close {
    position: absolute;
    top: 1rem;
    inset-inline-end: 1rem; // ← replaces right/left RTL hack
    background: transparent;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: currentColor;
    opacity: 0.55;
    transition:
      opacity 0.2s,
      transform 0.15s;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }
    &:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
  }

  // ── Actions slot ──────────────────────────────────────────────────────────
  .alert-actions {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(0, 0, 0, 0.07);
    display: flex;
    gap: 0.5rem;
  }
}

// ── Transition ────────────────────────────────────────────────────────────────
.alert-fade-enter-active,
.alert-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// ── Mobile ────────────────────────────────────────────────────────────────────
@media (max-width: 768px) {
  .alert {
    padding: 0.875rem;
    .alert-title {
      font-size: 0.9rem;
    }
    .alert-text {
      font-size: 0.8125rem;
    }
  }
}
</style>
