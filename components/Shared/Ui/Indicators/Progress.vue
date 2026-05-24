<!-- components/shared/Ui/Indicators/Progress.vue -->
<template>
  <div class="progress-wrapper" :class="{ 'show-label': showValue }">
    <!-- Linear Progress -->
    <div v-if="type === 'linear'" class="progress-linear" :class="size">
      <div class="progress-track">
        <div
          class="progress-fill"
          :class="{
            indeterminate: indeterminate,
            [color]: !indeterminate,
          }"
          :style="fillStyle"
        ></div>
      </div>
      <span v-if="showValue && !indeterminate" class="progress-label">
        {{ formattedValue }}
      </span>
    </div>

    <!-- Circular Progress -->
    <div
      v-else-if="type === 'circular'"
      class="progress-circular"
      :class="size"
      :style="circularStyles"
    >
      <svg viewBox="0 0 100 100">
        <!-- Background circle -->
        <circle
          cx="50"
          cy="50"
          :r="radius"
          fill="none"
          class="progress-track"
          :stroke-width="strokeWidth"
        />
        <!-- Progress circle -->
        <circle
          cx="50"
          cy="50"
          :r="radius"
          fill="none"
          class="progress-fill"
          :class="color"
          :stroke-width="strokeWidth"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          :stroke-linecap="rounded ? 'round' : 'butt'"
          :style="circleTransform"
        />
      </svg>
      <div v-if="showValue && !indeterminate" class="circular-label">
        <span>{{ formattedValue }}</span>
      </div>
      <div v-else-if="indeterminate" class="circular-spinner">
        <div class="spinner"></div>
      </div>
    </div>

    <!-- Spinner (indeterminate circular) -->
    <div v-else-if="type === 'spinner'" class="spinner-wrapper" :class="size">
      <div class="spinner" :class="color"></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: "linear",
    validator: (value) => ["linear", "circular", "spinner"].includes(value),
  },
  value: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 100,
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  color: {
    type: String,
    default: "primary",
    validator: (value) =>
      ["primary", "success", "warning", "danger", "info"].includes(value),
  },
  showValue: {
    type: Boolean,
    default: false,
  },
  indeterminate: {
    type: Boolean,
    default: false,
  },
  rounded: {
    type: Boolean,
    default: true,
  },
  strokeWidth: {
    type: Number,
    default: 8,
  },
});

// Linear progress fill style
const fillStyle = computed(() => {
  if (props.indeterminate) return {};
  return { width: `${props.value}%` };
});

// Formatted value
const formattedValue = computed(() => {
  return `${Math.round(props.value)}%`;
});

// Circular progress calculations
const radius = 40;
const circumference = 2 * Math.PI * radius;

const dashOffset = computed(() => {
  if (props.indeterminate) return 0;
  const progress = props.value / 100;
  return circumference * (1 - progress);
});

const circularStyles = computed(() => ({
  width: sizeMap[props.size],
  height: sizeMap[props.size],
}));

const circleTransform = computed(() => {
  return {
    transform: "rotate(-90deg)",
    transformOrigin: "50% 50%",
  };
});

// Size mappings
const sizeMap = {
  sm: "40px",
  md: "60px",
  lg: "80px",
};
</script>

<style scoped lang="scss">
// ── Semantic color tokens ─────────────────────────────────────────────────────
$colors: (
  success: #10b981,
  warning: #f59e0b,
  danger: #ef4444,
  info: #2563eb,
);

// ── Wrapper ───────────────────────────────────────────────────────────────────
.progress-wrapper {
  &.show-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
}

// ══════════════════════════════════════════════
//  LINEAR
// ══════════════════════════════════════════════
.progress-linear {
  flex: 1;

  &.sm .progress-track {
    height: 4px;
  }
  &.md .progress-track {
    height: 6px;
  }
  &.lg .progress-track {
    height: 8px;
  }

  .progress-track {
    background: var(--border-color);
    border-radius: 100px;
    overflow: hidden;
    width: 100%;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.3s ease;
    border-radius: 100px;

    // Primary follows theme
    &.primary {
      background: var(--primary);
    }

    // Semantic colors — static
    @each $name, $color in $colors {
      &.#{$name} {
        background: $color;
      }
    }

    // Indeterminate — uses primary var in gradient
    &.indeterminate {
      width: 30%;
      animation: indeterminate 1.5s infinite ease-in-out;
      background: linear-gradient(
        90deg,
        var(--primary),
        var(--primary-mid),
        var(--primary)
      );
      background-size: 200% 100%;
    }
  }

  .progress-label {
    font-size: 0.875rem;
    color: var(--text-sub); // ← was #6c757d
    min-width: 45px;
    text-align: end; // ← logical prop, handles RTL
  }
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}

// ══════════════════════════════════════════════
//  CIRCULAR
// ══════════════════════════════════════════════
.progress-circular {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .progress-track {
    stroke: var(--border-color); // ← was #e9ecef
  }

  .progress-fill {
    transition: stroke-dashoffset 0.3s ease;

    &.primary {
      stroke: var(--primary);
    }

    @each $name, $color in $colors {
      &.#{$name} {
        stroke: $color;
      }
    }
  }

  .circular-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary); // ← was #2c3e50
  }

  .circular-spinner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.sm .circular-label {
    font-size: 0.75rem;
  }
  &.lg .circular-label {
    font-size: 1rem;
  }
}

// ══════════════════════════════════════════════
//  SPINNER
// ══════════════════════════════════════════════
.spinner-wrapper {
  display: inline-flex;

  &.sm .spinner {
    width: 20px;
    height: 20px;
    border-width: 2px;
  }
  &.md .spinner {
    width: 30px;
    height: 30px;
    border-width: 3px;
  }
  &.lg .spinner {
    width: 40px;
    height: 40px;
    border-width: 4px;
  }
}

.spinner {
  border: 3px solid var(--border-color); // ← was #e9ecef
  border-top-color: var(--primary); // ← default follows theme
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  &.primary {
    border-top-color: var(--primary);
  }

  @each $name, $color in $colors {
    &.#{$name} {
      border-top-color: $color;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ── RTL ───────────────────────────────────────────────────────────────────────
// .progress-label uses text-align: end — no override needed
// indeterminate RTL reversal still needed (animation direction, not layout)
.bodyAR .progress-fill.indeterminate {
  animation-direction: reverse;
}
</style>
