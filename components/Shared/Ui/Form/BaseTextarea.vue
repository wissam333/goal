<template>
  <div
    class="input-root"
    :class="[
      `input--${variant}`,
      `input--${size}`,
      {
        'input--focused': isFocused,
        'input--filled': hasValue,
        'input--disabled': disabled,
        'input--error': error,
        'input--success': success,
        'input--has-left': iconLeft || $slots.left,
        'input--has-right': iconRight || $slots.right || clearable,
      },
    ]"
  >
    <!-- Floating label -->
    <label v-if="label" class="input-label" :for="inputId">
      {{ label }}
      <span v-if="required" class="input-required" aria-hidden="true">*</span>
    </label>

    <div class="input-wrap">
      <!-- Left icon / slot -->
      <span
        v-if="iconLeft || $slots.left"
        class="input-adornment input-adornment--left"
      >
        <slot name="left">
          <Icon :name="iconLeft" :size="adornmentSize" />
        </slot>
      </span>

      <!-- Native input -->
      <textarea
        :id="inputId"
        class="input-field"
        v-bind="$attrs"
        :rows="rows"
        :cols="cols"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <!-- Clear button -->
      <button
        v-if="clearable && hasValue && !disabled"
        type="button"
        class="input-adornment input-adornment--right input-clear"
        @click="$emit('update:modelValue', '')"
        tabindex="-1"
        aria-label="Clear"
      >
        <Icon name="mdi:close-circle" :size="adornmentSize" />
      </button>

      <!-- Password toggle -->
      <button
        v-else-if="type === 'password'"
        type="button"
        class="input-adornment input-adornment--right input-eye"
        @click="showPassword = !showPassword"
        tabindex="-1"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
      >
        <Icon
          :name="showPassword ? 'mdi:eye-off' : 'mdi:eye'"
          :size="adornmentSize"
        />
      </button>

      <!-- Right icon / slot -->
      <span
        v-else-if="iconRight || $slots.right"
        class="input-adornment input-adornment--right"
      >
        <slot name="right">
          <Icon :name="iconRight" :size="adornmentSize" />
        </slot>
      </span>

      <!-- Focus ring -->
      <span class="input-focus-ring" aria-hidden="true" />
    </div>

    <!-- Helper / error text -->
    <transition name="hint">
      <p v-if="error && errorMessage" class="input-hint input-hint--error">
        <Icon name="mdi:alert-circle" size="13" />
        {{ errorMessage }}
      </p>
      <p v-else-if="hint" class="input-hint">
        {{ hint }}
      </p>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  label: { type: String, default: null },
  placeholder: { type: String, default: "" },
  type: { type: String, default: "text" },
  variant: {
    type: String,
    default: "default",
    validator: (v) => ["default", "filled", "underline"].includes(v),
  },
  size: {
    type: String,
    default: "md",
    validator: (v) => ["sm", "md", "lg"].includes(v),
  },
  iconLeft: { type: String, default: null },
  iconRight: { type: String, default: null },
  hint: { type: String, default: null },
  errorMessage: { type: String, default: null },
  error: { type: Boolean, default: false },
  success: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
  autocomplete: { type: String, default: "off" },
  rows: { type: Number, default: 10 },
  cols: { type: Number, default: 30 },
});

defineEmits(["update:modelValue"]);
defineOptions({ inheritAttrs: false });

const isFocused = ref(false);
const showPassword = ref(false);

const inputId = computed(
  () => `input-${Math.random().toString(36).slice(2, 8)}`,
);
const hasValue = computed(
  () =>
    props.modelValue !== "" &&
    props.modelValue !== null &&
    props.modelValue !== undefined,
);
const currentType = computed(() =>
  props.type === "password"
    ? showPassword.value
      ? "text"
      : "password"
    : props.type,
);

const adornmentSize = computed(() => ({ sm: 15, md: 17, lg: 19 })[props.size]);
</script>

<style scoped lang="scss">
// ── Base ──────────────────────────────────────────────────────────────────────
.input-root {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
}

// ── Label ─────────────────────────────────────────────────────────────────────
.input-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.005em;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  transition: color 0.2s;

  .input--focused & {
    color: var(--primary);
  }
  .input--error & {
    color: #cc3333;
  }
  .input--success & {
    color: #2d8c6b;
  }
  .input--disabled & {
    color: var(--text-muted);
  }
}

.input-required {
  color: #cc3333;
  font-size: 0.9em;
}

// ── Wrap ──────────────────────────────────────────────────────────────────────
.input-wrap {
  position: relative;
  display: flex;
  align-items: flex-start; // ← textarea needs top-alignment
  border-radius: 10px;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

// ── Field ─────────────────────────────────────────────────────────────────────
.input-field {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-weight: 500;
  color: var(--text-primary);
  resize: vertical; // ← textarea-specific
  font-family: inherit;
  line-height: 1.6;
  transition: color 0.2s;

  &::placeholder {
    color: var(--text-muted);
    font-weight: 400;
  }
  &:disabled {
    color: var(--text-muted);
    cursor: not-allowed;
    resize: none;
  }

  // Sizes
  .input--sm & {
    font-size: 0.8125rem;
    padding: 0.5rem 0.75rem;
  }
  .input--md & {
    font-size: 0.875rem;
    padding: 0.65rem 0.9rem;
  }
  .input--lg & {
    font-size: 0.9375rem;
    padding: 0.8rem 1rem;
  }

  // Icon offsets — logical props handle RTL automatically
  .input--has-left & {
    padding-inline-start: 2.5rem;
  }
  .input--has-right & {
    padding-inline-end: 2.5rem;
  }

  .input--sm.input--has-left & {
    padding-inline-start: 2.2rem;
  }
  .input--sm.input--has-right & {
    padding-inline-end: 2.2rem;
  }
  .input--lg.input--has-left & {
    padding-inline-start: 2.8rem;
  }
  .input--lg.input--has-right & {
    padding-inline-end: 2.8rem;
  }
}

// ── Adornments ────────────────────────────────────────────────────────────────
.input-adornment {
  position: absolute;
  top: 0.75rem; // ← top-pinned for textarea
  transform: none; // ← no vertical centering
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: color 0.2s;
  pointer-events: none;

  &--left {
    inset-inline-start: 0.75rem;
  }
  &--right {
    inset-inline-end: 0.75rem;
  }

  .input--focused & {
    color: var(--primary);
  }
  .input--error & {
    color: #cc3333;
  }
  .input--success & {
    color: #2d8c6b;
  }
}

.input-clear,
.input-eye {
  pointer-events: auto;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;

  &:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }
}

// ── Focus ring ────────────────────────────────────────────────────────────────
.input-focus-ring {
  position: absolute;
  inset: -2px;
  border-radius: 12px;
  border: 2px solid transparent;
  pointer-events: none;
  transition: border-color 0.2s ease;
}

// ══════════════════════════════════════════════
//  VARIANT: DEFAULT
// ══════════════════════════════════════════════
.input--default .input-wrap {
  background: var(--bg-surface);
  border: 1.5px solid var(--border-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  &:hover {
    border-color: var(--text-muted);
  }
}
.input--default.input--focused .input-wrap {
  border-color: var(--primary);
  .input-focus-ring {
    border-color: var(--primary-soft);
  }
}
.input--default.input--error .input-wrap {
  border-color: #cc3333;
  .input-focus-ring {
    border-color: rgba(204, 51, 51, 0.2);
  }
}
.input--default.input--success .input-wrap {
  border-color: #2d8c6b;
  .input-focus-ring {
    border-color: rgba(45, 140, 107, 0.2);
  }
}

// ══════════════════════════════════════════════
//  VARIANT: FILLED
// ══════════════════════════════════════════════
.input--filled .input-wrap {
  background: var(--bg-elevated);
  border: 1.5px solid transparent;
  &:hover {
    background: var(--bg-page);
  }
}
.input--filled.input--focused .input-wrap {
  background: var(--bg-surface);
  border-color: var(--primary);
  .input-focus-ring {
    border-color: var(--primary-soft);
  }
}
.input--filled.input--error .input-wrap {
  background: rgba(204, 51, 51, 0.05);
  border-color: #cc3333;
}
.input--filled.input--success .input-wrap {
  background: rgba(45, 140, 107, 0.05);
  border-color: #2d8c6b;
}

// ══════════════════════════════════════════════
//  VARIANT: UNDERLINE
// ══════════════════════════════════════════════
.input--underline .input-wrap {
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--border-color);
  border-radius: 0;
  &:hover {
    border-bottom-color: var(--text-muted);
  }
}
.input--underline .input-focus-ring {
  display: none;
}
.input--underline.input--focused .input-wrap {
  border-bottom-color: var(--primary);
}
.input--underline.input--error .input-wrap {
  border-bottom-color: #cc3333;
}
.input--underline.input--success .input-wrap {
  border-bottom-color: #2d8c6b;
}

// ── Disabled ──────────────────────────────────────────────────────────────────
.input--disabled .input-wrap {
  background: var(--bg-elevated) !important;
  border-color: var(--border-color) !important;
  cursor: not-allowed;
  opacity: 0.6;
}

// ── Hint ──────────────────────────────────────────────────────────────────────
.input-hint {
  font-size: 0.775rem;
  color: var(--text-sub);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  line-height: 1.4;

  &--error {
    color: #cc3333;
  }
  .input--success & {
    color: #2d8c6b;
  }
}

// ── Hint transition ───────────────────────────────────────────────────────────
.hint-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.hint-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.hint-enter-from,
.hint-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
