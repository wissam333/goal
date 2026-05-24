<template>
  <button
    class="btn"
    :class="[
      `btn--${actualVariant}`,
      `btn--${size}`,
      {
        'btn--outline': isOutline,
        'btn--ghost': ghost,
        'btn--loading': loading,
        'btn--disabled': disabled,
        'btn--icon-only': !hasSlot && (iconLeft || iconRight),
      },
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span class="btn-shimmer" aria-hidden="true" />

    <span v-if="iconLeft && !loading" class="btn-icon btn-icon--left">
      <Icon :name="iconLeft" :size="iconSize" />
    </span>

    <span v-if="loading" class="btn-icon btn-icon--left btn-spinner">
      <Icon name="mdi:loading" :size="iconSize" />
    </span>

    <span v-if="hasSlot" class="btn-label">
      <slot />
    </span>

    <span v-if="iconRight && !loading" class="btn-icon btn-icon--right">
      <Icon :name="iconRight" :size="iconSize" />
    </span>
  </button>
</template>

<script setup>
import { useSlots, computed } from "vue";

const slots = useSlots();

const props = defineProps({
  variant: {
    type: String,
    default: "primary",
    validator: (v) =>
      [
        "primary",
        "secondary",
        "success",
        "error",
        "warning",
        "info",
        "neutral",
        "outline", // Added "outline" as a variant
      ].includes(v),
  },
  size: {
    type: String,
    default: "md",
    validator: (v) => ["sm", "md", "lg"].includes(v),
  },
  iconLeft: { type: String, default: null },
  iconRight: { type: String, default: null },
  outline: { type: Boolean, default: false },
  ghost: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const hasSlot = computed(() => !!slots.default);
const iconSize = computed(() => ({ sm: 15, md: 17, lg: 20 })[props.size]);

// Computed property to determine if it's an outline button
const isOutline = computed(() => {
  return props.variant === "outline" || props.outline;
});

// Get the actual variant (default to primary for outline variant)
const actualVariant = computed(() => {
  if (props.variant === "outline") return "primary";
  return props.variant;
});
</script>

<style scoped lang="scss">
@use "sass:map";

// ── Static semantic variants (never change with theme) ────────────────────────
$variants: (
  success: (
    bg: #2d8c6b,
    bg-dark: #1f6e52,
    sheen: rgba(255, 255, 255, 0.14),
    ghost-bg: rgba(45, 140, 107, 0.1),
  ),
  error: (
    bg: #cc3333,
    bg-dark: #a82828,
    sheen: rgba(255, 255, 255, 0.14),
    ghost-bg: rgba(204, 51, 51, 0.1),
  ),
  warning: (
    bg: #c97a1a,
    bg-dark: #a86214,
    sheen: rgba(255, 255, 255, 0.14),
    ghost-bg: rgba(201, 122, 26, 0.1),
  ),
  info: (
    bg: #2c5fcc,
    bg-dark: #1e48a8,
    sheen: rgba(255, 255, 255, 0.14),
    ghost-bg: rgba(44, 95, 204, 0.1),
  ),
  neutral: (
    bg: #4b5563,
    bg-dark: #374151,
    sheen: rgba(255, 255, 255, 0.12),
    ghost-bg: rgba(75, 85, 99, 0.1),
  ),
);

// ── Base ──────────────────────────────────────────────────────────────────────
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1.5px solid transparent;
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  user-select: none;
  font-family: inherit;
  transition:
    transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    filter 0.18s ease,
    opacity 0.18s ease,
    color 0.18s ease;

  // ── Sizes ──────────────────────────────────────────────────────────────────
  &.btn--sm {
    padding: 0.4rem 0.85rem;
    font-size: 0.8rem;
    border-radius: 8px;
    gap: 0.35rem;
  }
  &.btn--md {
    padding: 0.58rem 1.2rem;
    font-size: 0.875rem;
  }
  &.btn--lg {
    padding: 0.72rem 1.55rem;
    font-size: 0.9375rem;
    border-radius: 12px;
    gap: 0.6rem;
  }

  // ── Icon-only square ───────────────────────────────────────────────────────
  &.btn--icon-only {
    &.btn--sm {
      padding: 0.4rem;
    }
    &.btn--md {
      padding: 0.58rem;
    }
    &.btn--lg {
      padding: 0.72rem;
    }
  }

  // ── States ─────────────────────────────────────────────────────────────────
  &:active:not(:disabled) {
    transform: scale(0.96) !important;
  }
  &.btn--disabled,
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
  }
  &.btn--loading {
    cursor: wait;
  }
}

// ── Shimmer ───────────────────────────────────────────────────────────────────
.btn-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.18) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  background-position: -100% 0;
  transition: background-position 0.45s ease;
  pointer-events: none;
  border-radius: inherit;
}
.btn:hover:not(:disabled) .btn-shimmer {
  background-position: 100% 0;
}

// ── PRIMARY — follows --primary CSS var ───────────────────────────────────────
// ── PRIMARY — follows --primary CSS var ───────────────────────────────────────
.btn--primary {
  &:not(.btn--outline):not(.btn--ghost) {
    background-color: var(--primary);
    border-color: var(--primary);
    color: #fff;
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.2),
      0 1px 2px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);

    &:hover:not(:disabled) {
      filter: brightness(0.88);
      transform: translateY(-1px);
      box-shadow:
        0 6px 18px rgba(0, 0, 0, 0.24),
        0 2px 6px rgba(0, 0, 0, 0.14),
        inset 0 1px 0 rgba(255, 255, 255, 0.12);
    }
  }

  &.btn--outline {
    background-color: transparent;
    color: var(--primary);
    border-color: var(--primary);

    &:hover:not(:disabled) {
      background-color: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
    }

    // Dark mode - keep same primary color but ensure visibility
    :root.dark & {
      color: var(--primary); // Keep the same primary color
      border-color: var(--primary);

      &:hover:not(:disabled) {
        background-color: var(--primary);
        color: #ffffff;
        border-color: var(--primary);
        text-shadow: none; // Remove glow on hover
      }
    }
  }

  &.btn--ghost {
    background-color: transparent;
    border-color: transparent;
    color: var(--primary);

    &:hover:not(:disabled) {
      background-color: var(--primary-soft);
      transform: translateY(-1px);
    }

    :root.dark & {
      color: var(--primary);

      &:hover:not(:disabled) {
        background-color: var(--primary-soft);
        text-shadow: none;
      }
    }
  }
}

// ── SECONDARY — follows --secondary CSS var ────────────────────────────
.btn--secondary {
  &:not(.btn--outline):not(.btn--ghost) {
    background-color: var(--secondary);
    border-color: var(--secondary);
    color: #fff;
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.2),
      0 1px 2px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);

    &:hover:not(:disabled) {
      filter: brightness(0.88);
      transform: translateY(-1px);
      box-shadow:
        0 6px 18px rgba(0, 0, 0, 0.24),
        0 2px 6px rgba(0, 0, 0, 0.14),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
  }

  &.btn--outline {
    background-color: transparent;
    color: var(--secondary);
    border-color: var(--secondary);

    &:hover:not(:disabled) {
      background-color: var(--secondary);
      color: #ffffff;
      border-color: var(--secondary);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
    }

    // Dark mode - keep same secondary color
    :root.dark & {
      color: var(--secondary);
      border-color: var(--secondary);
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);

      &:hover:not(:disabled) {
        background-color: var(--secondary);
        color: #ffffff;
        border-color: var(--secondary);
        text-shadow: none;
      }
    }
  }

  &.btn--ghost {
    background-color: transparent;
    border-color: transparent;
    color: var(--secondary);

    &:hover:not(:disabled) {
      background-color: var(--secondary-soft);
      transform: translateY(-1px);
    }

    :root.dark & {
      color: var(--secondary);
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);

      &:hover:not(:disabled) {
        background-color: var(--secondary-soft);
        text-shadow: none;
      }
    }
  }
}

// ── SEMANTIC VARIANTS — static colors, generated via @each ───────────────────
@each $name, $tokens in $variants {
  $bg: map.get($tokens, bg);
  $bg-dark: map.get($tokens, bg-dark);
  $sheen: map.get($tokens, sheen);
  $ghost-bg: map.get($tokens, ghost-bg);

  .btn--#{$name} {
    &:not(.btn--outline):not(.btn--ghost) {
      background-color: $bg;
      border-color: $bg;
      color: #fff;
      box-shadow:
        0 2px 6px rgba(0, 0, 0, 0.2),
        0 1px 2px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 $sheen;

      &:hover:not(:disabled) {
        background-color: $bg-dark;
        border-color: $bg-dark;
        transform: translateY(-1px);
        box-shadow:
          0 6px 18px rgba(0, 0, 0, 0.24),
          0 2px 6px rgba(0, 0, 0, 0.14),
          inset 0 1px 0 $sheen;
      }
    }

    &.btn--outline {
      background-color: transparent;
      color: $bg;
      border-color: $bg;

      &:hover:not(:disabled) {
        background-color: $bg;
        color: #ffffff;
        border-color: $bg;
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
      }
    }

    &.btn--ghost {
      background-color: transparent;
      border-color: transparent;
      color: $bg;

      &:hover:not(:disabled) {
        background-color: $ghost-bg;
        transform: translateY(-1px);
      }
    }
  }
}

// ── Icon ──────────────────────────────────────────────────────────────────────
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
.btn-spinner {
  animation: btn-spin 0.7s linear infinite;
}
@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

// ── Label ─────────────────────────────────────────────────────────────────────
.btn-label {
  display: inline-flex;
  align-items: center;
}
</style>
