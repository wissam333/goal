<template>
  <div
    class="select-root"
    :class="[
      `select--${variant}`,
      `select--${size}`,
      {
        'select--open': isOpen,
        'select--filled': hasValue,
        'select--disabled': disabled,
        'select--error': error,
        'select--success': success,
        'select--has-left': iconLeft || $slots.left,
      },
    ]"
    ref="rootRef"
    v-click-outside="close"
  >
    <!-- Label -->
    <label v-if="label" class="select-label">
      {{ label }}
      <span v-if="required" class="select-required" aria-hidden="true">*</span>
    </label>

    <div class="select-wrap" @click="toggle">
      <!-- Left icon -->
      <span
        v-if="iconLeft || $slots.left"
        class="select-adornment select-adornment--left"
      >
        <slot name="left">
          <Icon :name="iconLeft" :size="adornmentSize" />
        </slot>
      </span>

      <!-- Display value -->
      <div class="select-display">
        <span v-if="selectedOption" class="select-value">
          <Icon
            v-if="selectedOption.icon"
            :name="selectedOption.icon"
            :size="adornmentSize"
            class="select-value-icon"
          />
          {{ selectedOption.label }}
        </span>
        <span v-else class="select-placeholder">{{ placeholder }}</span>
      </div>

      <!-- Clear button -->
      <button
        v-if="clearable && hasValue && !disabled"
        type="button"
        class="select-adornment select-adornment--right select-clear"
        @click.stop="clear"
        tabindex="-1"
        aria-label="Clear"
      >
        <Icon name="mdi:close-circle" :size="adornmentSize" />
      </button>

      <!-- Chevron -->
      <span
        v-else
        class="select-adornment select-adornment--right select-chevron"
        :class="{ 'select-chevron--open': isOpen }"
      >
        <Icon name="mdi:chevron-down" :size="adornmentSize + 2" />
      </span>

      <!-- Focus ring -->
      <span class="select-focus-ring" aria-hidden="true" />
    </div>

    <!-- Dropdown -->
    <transition name="dropdown">
      <div
        v-if="isOpen"
        class="select-dropdown"
        :class="`select-dropdown--${dropdownPosition}`"
      >
        <!-- Search -->
        <div v-if="searchable" class="select-search-wrap">
          <Icon name="mdi:magnify" size="15" class="select-search-icon" />
          <input
            ref="searchRef"
            v-model="searchQuery"
            class="select-search"
            placeholder="Search…"
            @click.stop
            @keydown.esc="close"
            @keydown.enter.prevent="selectHighlighted"
            @keydown.arrow-down.prevent="moveHighlight(1)"
            @keydown.arrow-up.prevent="moveHighlight(-1)"
          />
        </div>

        <!-- Options list -->
        <ul class="select-list" role="listbox">
          <template v-if="filteredOptions.length">
            <template
              v-for="item in filteredOptions"
              :key="item.value ?? item.label"
            >
              <!-- Group header -->
              <li v-if="item._group" class="select-group-label">
                {{ item.label }}
              </li>

              <!-- Option -->
              <li
                v-else
                class="select-option"
                :class="{
                  'select-option--selected': isSelected(item),
                  'select-option--highlighted':
                    highlightedIndex === getIndex(item),
                  'select-option--disabled': item.disabled,
                }"
                role="option"
                :aria-selected="isSelected(item)"
                @click.stop="select(item)"
                @mouseenter="highlightedIndex = getIndex(item)"
              >
                <span class="select-option-inner">
                  <Icon
                    v-if="item.icon"
                    :name="item.icon"
                    size="16"
                    class="select-option-icon"
                  />
                  <span class="select-option-label">{{ item.label }}</span>
                  <span v-if="item.badge" class="select-option-badge">{{
                    item.badge
                  }}</span>
                </span>
                <Icon
                  v-if="isSelected(item)"
                  name="mdi:check"
                  size="15"
                  class="select-option-check"
                />
              </li>
            </template>
          </template>

          <li v-else class="select-empty">
            <Icon name="mdi:magnify-close" size="18" />
            {{ $t("No options found") }}
          </li>
        </ul>
      </div>
    </transition>

    <!-- Hint / error -->
    <transition name="hint">
      <p v-if="error && errorMessage" class="select-hint select-hint--error">
        <Icon name="mdi:alert-circle" size="13" />
        {{ errorMessage }}
      </p>
      <p v-else-if="hint" class="select-hint">{{ hint }}</p>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";

const props = defineProps({
  modelValue: { type: [String, Number, Array], default: null },
  options: { type: Array, default: () => [] },
  label: { type: String, default: null },
  placeholder: { type: String, default: "Select an option" },
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
  hint: { type: String, default: null },
  errorMessage: { type: String, default: null },
  error: { type: Boolean, default: false },
  success: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
  searchable: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
  dropdownPosition: {
    type: String,
    default: "bottom",
    validator: (v) => ["top", "bottom"].includes(v),
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const isOpen = ref(false);
const searchQuery = ref("");
const highlightedIndex = ref(-1);
const searchRef = ref(null);
const rootRef = ref(null);

// Normalize options — support strings, objects, groups
const normalizedOptions = computed(() =>
  props.options
    .map((o) => {
      if (typeof o === "string") return { label: o, value: o };
      if (o.options)
        return [
          { label: o.label, _group: true },
          ...o.options.map((i) =>
            typeof i === "string" ? { label: i, value: i } : i,
          ),
        ];
      return o;
    })
    .flat(),
);

const flatOptions = computed(() =>
  normalizedOptions.value.filter((o) => !o._group && !o.disabled),
);

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) return normalizedOptions.value;
  const q = searchQuery.value.toLowerCase();
  return normalizedOptions.value.filter(
    (o) => o._group || o.label?.toLowerCase().includes(q),
  );
});

const selectedOption = computed(() => {
  if (props.multiple) return null;
  return flatOptions.value.find((o) => o.value === props.modelValue) ?? null;
});

const hasValue = computed(() =>
  props.multiple
    ? Array.isArray(props.modelValue) && props.modelValue.length > 0
    : props.modelValue !== null &&
      props.modelValue !== undefined &&
      props.modelValue !== "",
);

const adornmentSize = computed(() => ({ sm: 15, md: 17, lg: 19 })[props.size]);

function toggle() {
  if (props.disabled) return;
  isOpen.value ? close() : open();
}

function open() {
  isOpen.value = true;
  searchQuery.value = "";
  highlightedIndex.value = -1;
  nextTick(() => searchRef.value?.focus());
}

function close() {
  isOpen.value = false;
  searchQuery.value = "";
}

function select(option) {
  if (option.disabled) return;
  if (props.multiple) {
    const current = Array.isArray(props.modelValue)
      ? [...props.modelValue]
      : [];
    const idx = current.indexOf(option.value);
    idx === -1 ? current.push(option.value) : current.splice(idx, 1);
    emit("update:modelValue", current);
    emit("change", current);
  } else {
    emit("update:modelValue", option.value);
    emit("change", option.value);
    close();
  }
}

function clear() {
  emit("update:modelValue", props.multiple ? [] : null);
  emit("change", props.multiple ? [] : null);
}

function isSelected(option) {
  if (props.multiple)
    return (
      Array.isArray(props.modelValue) && props.modelValue.includes(option.value)
    );
  return props.modelValue === option.value;
}

function getIndex(option) {
  return flatOptions.value.indexOf(option);
}

function moveHighlight(dir) {
  const max = flatOptions.value.length - 1;
  highlightedIndex.value = Math.min(
    Math.max(highlightedIndex.value + dir, 0),
    max,
  );
}

function selectHighlighted() {
  if (highlightedIndex.value >= 0)
    select(flatOptions.value[highlightedIndex.value]);
}

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => {
      if (!el.contains(e.target)) binding.value();
    };
    document.addEventListener("mousedown", el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener("mousedown", el._clickOutside);
  },
};
</script>

<style scoped lang="scss">
// ── Root ──────────────────────────────────────────────────────────────────────
.select-root {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
  position: relative;
}

// ── Label ─────────────────────────────────────────────────────────────────────
.select-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary); // ← was #374151
  letter-spacing: -0.005em;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  transition: color 0.2s;

  .select--open & {
    color: var(--primary);
  }
  .select--error & {
    color: #cc3333;
  }
  .select--success & {
    color: #2d8c6b;
  }
  .select--disabled & {
    color: var(--text-muted);
  }
}

.select-required {
  color: #cc3333;
  font-size: 0.9em;
}

// ── Wrap ──────────────────────────────────────────────────────────────────────
.select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 10px;
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
  user-select: none;

  .select--disabled & {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
}

// ── Display ───────────────────────────────────────────────────────────────────
.select-display {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
  padding-inline-end: 2.5rem; // ← always leave room for chevron

  .select--sm & {
    font-size: 0.8125rem;
    padding-block: 0.5rem;
    padding-inline-start: 0.75rem;
  }
  .select--md & {
    font-size: 0.875rem;
    padding-block: 0.65rem;
    padding-inline-start: 0.9rem;
  }
  .select--lg & {
    font-size: 0.9375rem;
    padding-block: 0.8rem;
    padding-inline-start: 1rem;
  }

  .select--has-left & {
    padding-inline-start: 2.5rem;
  }
}

.select-value {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-primary); // ← was #111827
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-value-icon {
  flex-shrink: 0;
  color: var(--text-muted);
}

.select-placeholder {
  color: var(--text-muted); // ← was #9ca3af
  font-weight: 400;
}

// ── Adornments ────────────────────────────────────────────────────────────────
.select-adornment {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: color 0.2s;
  pointer-events: none;

  &--left {
    inset-inline-start: 0.75rem;
  } // ← replaces RTL block
  &--right {
    inset-inline-end: 0.75rem;
  }

  .select--open & {
    color: var(--primary);
  }
  .select--error & {
    color: #cc3333;
  }
  .select--success & {
    color: #2d8c6b;
  }
}

.select-chevron {
  transition:
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    color 0.2s;
  &--open {
    transform: translateY(-50%) rotate(180deg);
  }
}

.select-clear {
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
.select-focus-ring {
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
.select--default .select-wrap {
  background: var(--bg-surface);
  border: 1.5px solid var(--border-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  &:hover {
    border-color: var(--text-muted);
  }
}
.select--default.select--open .select-wrap {
  border-color: var(--primary);
  .select-focus-ring {
    border-color: var(--primary-soft);
  }
}
.select--default.select--error .select-wrap {
  border-color: #cc3333;
  .select-focus-ring {
    border-color: rgba(204, 51, 51, 0.2);
  }
}
.select--default.select--success .select-wrap {
  border-color: #2d8c6b;
  .select-focus-ring {
    border-color: rgba(45, 140, 107, 0.2);
  }
}

// ══════════════════════════════════════════════
//  VARIANT: FILLED
// ══════════════════════════════════════════════
.select--filled .select-wrap {
  background: var(--bg-elevated);
  border: 1.5px solid transparent;
  &:hover {
    background: var(--bg-page);
  }
}
.select--filled.select--open .select-wrap {
  background: var(--bg-surface);
  border-color: var(--primary);
  .select-focus-ring {
    border-color: var(--primary-soft);
  }
}
.select--filled.select--error .select-wrap {
  background: rgba(204, 51, 51, 0.05);
  border-color: #cc3333;
}
.select--filled.select--success .select-wrap {
  background: rgba(45, 140, 107, 0.05);
  border-color: #2d8c6b;
}

// ══════════════════════════════════════════════
//  VARIANT: UNDERLINE
// ══════════════════════════════════════════════
.select--underline .select-wrap {
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--border-color);
  border-radius: 0;
  &:hover {
    border-bottom-color: var(--text-muted);
  }
}
.select--underline .select-focus-ring {
  display: none;
}
.select--underline.select--open .select-wrap {
  border-bottom-color: var(--primary);
}
.select--underline.select--error .select-wrap {
  border-bottom-color: #cc3333;
}
.select--underline.select--success .select-wrap {
  border-bottom-color: #2d8c6b;
}

// ── Dropdown ──────────────────────────────────────────────────────────────────
.select-dropdown {
  position: absolute;
  inset-inline: 0; // ← was left: 0; right: 0
  z-index: 999;
  background: var(--bg-surface);
  border: 1.5px solid var(--border-color);
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.08),
    0 12px 28px -4px rgba(0, 0, 0, 0.12);
  overflow: hidden;

  &--bottom {
    top: calc(100% + 6px);
  }
  &--top {
    bottom: calc(100% + 6px);
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
.select-search-wrap {
  position: relative;
  padding: 0.5rem 0.625rem;
  border-bottom: 1px solid var(--border-color);
}

.select-search-icon {
  position: absolute;
  inset-inline-start: 1.1rem; // ← replaces RTL override
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.select-search {
  width: 100%;
  padding: 0.45rem 0.5rem 0.45rem 2rem;
  font-size: 0.8125rem;
  color: var(--text-primary);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 7px;
  outline: none;
  transition:
    border-color 0.15s,
    background 0.15s;

  &::placeholder {
    color: var(--text-muted);
  }
  &:focus {
    border-color: var(--primary);
    background: var(--bg-surface);
  }
}

// ── List ──────────────────────────────────────────────────────────────────────
.select-list {
  list-style: none;
  margin: 0;
  padding: 0.375rem;
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }
}

// ── Group label ───────────────────────────────────────────────────────────────
.select-group-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  padding: 0.5rem 0.625rem 0.25rem;
}

// ── Option ────────────────────────────────────────────────────────────────────
.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.625rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
  font-size: 0.875rem;
  color: var(--text-primary);

  &:hover,
  &--highlighted {
    background: var(--primary-soft); // ← was hardcoded #f5f7ff
  }

  &--selected {
    background: var(--primary-soft);
    color: var(--primary); // ← was hardcoded blue
    font-weight: 600;
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.select-option-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.select-option-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.select-option-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-option-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 99px;
  background: var(--bg-elevated); // ← was #e5e7eb
  color: var(--text-primary);
  flex-shrink: 0;
}

.select-option-check {
  color: var(--primary); // ← was hardcoded blue
  flex-shrink: 0;
}

// ── Empty ─────────────────────────────────────────────────────────────────────
.select-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1.25rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-align: center;
}

// ── Hint ──────────────────────────────────────────────────────────────────────
.select-hint {
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
  .select--success & {
    color: #2d8c6b;
  }
}

// ── Dropdown animation ────────────────────────────────────────────────────────
.dropdown-enter-active {
  transition:
    opacity 0.18s ease,
    transform 0.2s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.dropdown-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

// ── Hint animation ────────────────────────────────────────────────────────────
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
