<!-- components/Shared/Ui/Form/Combobox.vue -->
<template>
  <div class="combo-root" ref="rootRef">
    <!-- Label -->
    <label v-if="label" class="combo-label">{{ label }}</label>

    <div
      class="combo-wrap"
      :class="{
        'combo-wrap--open': isOpen,
        'combo-wrap--filled': !!modelValue,
      }"
    >
      <!-- Search input -->
      <span class="combo-icon-left">
        <Icon v-if="!loading" name="mdi:account-search-outline" size="17" />
        <Icon v-else name="mdi:loading" size="17" class="spin" />
      </span>

      <input
        ref="inputRef"
        class="combo-input"
        :value="inputDisplay"
        :placeholder="placeholder || label"
        autocomplete="off"
        @input="onInput"
        @focus="open"
        @blur="onBlur"
        @keydown.enter.prevent="onEnter"
        @keydown.escape="close"
        @keydown.down.prevent="moveDown"
        @keydown.up.prevent="moveUp"
      />

      <!-- Clear button -->
      <button
        v-if="modelValue"
        type="button"
        class="combo-clear"
        @mousedown.prevent="clear"
      >
        <Icon name="mdi:close-circle" size="16" />
      </button>
    </div>

    <!-- Selected chip below input -->
    <div v-if="modelValue" class="combo-chip">
      <Icon name="mdi:check-circle" size="15" class="chip-check" />
      <span>{{ modelValue[displayKey] }}</span>
      <button type="button" class="chip-remove" @click="clear">
        <Icon name="mdi:close" size="13" />
      </button>
    </div>

    <!-- Dropdown -->
    <Teleport to="body">
      <div
        v-if="isOpen && (options.length || (allowCreate && searchVal.trim()))"
        class="combo-dropdown"
        :style="dropdownStyle"
        @mousedown.prevent
      >
        <!-- Existing options -->
        <button
          v-for="(opt, i) in options"
          :key="opt.id ?? i"
          class="combo-item"
          :class="{ 'combo-item--active': activeIdx === i }"
          @click="select(opt)"
          @mousedown="cancelClose"
        >
          <Icon name="mdi:account-outline" size="14" />
          <span class="combo-item-name">{{ opt[displayKey] }}</span>
          <span v-if="opt[subKey]" class="combo-item-sub">{{
            opt[subKey]
          }}</span>
        </button>

        <!-- Divider if both lists present -->
        <div
          v-if="
            options.length && allowCreate && searchVal.trim() && !exactMatch
          "
          class="combo-divider"
        />

        <!-- Create option -->
        <button
          v-if="allowCreate && searchVal.trim() && !exactMatch"
          class="combo-item combo-item--create"
          :class="{ 'combo-item--active': activeIdx === options.length }"
          @click="onCreate"
        >
          <Icon name="mdi:plus-circle-outline" size="14" />
          <span>{{ createLabel || "إضافة" }}:</span>
          <strong>{{ searchVal }}</strong>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, default: null },
  search: { type: String, default: "" },
  options: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  label: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  allowCreate: { type: Boolean, default: true },
  createLabel: { type: String, default: "" },
  displayKey: { type: String, default: "name" },
  subKey: { type: String, default: "phone" },
});

const emit = defineEmits([
  "update:modelValue",
  "update:search",
  "select",
  "create",
]);

const rootRef = ref(null);
const inputRef = ref(null);
const isOpen = ref(false);
const activeIdx = ref(-1);
const dropdownStyle = ref({});

// The text shown in the input — when a customer is selected, show their name
const searchVal = computed(() => props.search);
const inputDisplay = computed(() =>
  props.modelValue ? props.modelValue[props.displayKey] : props.search,
);

const exactMatch = computed(() =>
  props.options.some(
    (o) => o[props.displayKey]?.toLowerCase() === props.search?.toLowerCase(),
  ),
);

const totalItems = computed(
  () =>
    props.options.length +
    (props.allowCreate && props.search?.trim() && !exactMatch.value ? 1 : 0),
);

const open = () => {
  isOpen.value = true;
  activeIdx.value = -1;
  nextTick(updateDropdownPosition);
};

const pendingClose = ref(false);

const onBlur = () => {
  pendingClose.value = true;
  setTimeout(() => {
    if (pendingClose.value) close();
  }, 220);
};

const close = () => {
  isOpen.value = false;
  activeIdx.value = -1;
  pendingClose.value = false;
};

const cancelClose = () => {
  pendingClose.value = false;
};

const onInput = (e) => {
  // Clear the selected object when user types again
  if (props.modelValue) emit("update:modelValue", null);
  emit("update:search", e.target.value);
  activeIdx.value = -1;
  if (!isOpen.value) isOpen.value = true;
  nextTick(updateDropdownPosition);
};

const select = (opt) => {
  emit("update:modelValue", opt);
  emit("update:search", opt[props.displayKey]);
  emit("select", opt);
  close();
};

const clear = () => {
  emit("update:modelValue", null);
  emit("update:search", "");
  nextTick(() => inputRef.value?.focus());
};

const onCreate = () => {
  emit("create", props.search);
  close();
};

const onEnter = () => {
  if (activeIdx.value >= 0 && activeIdx.value < props.options.length) {
    select(props.options[activeIdx.value]);
  } else if (activeIdx.value === props.options.length) {
    onCreate();
  } else if (props.options.length === 1) {
    select(props.options[0]);
  } else if (
    !props.options.length &&
    props.allowCreate &&
    props.search?.trim()
  ) {
    onCreate();
  }
};

const moveDown = () => {
  activeIdx.value = Math.min(activeIdx.value + 1, totalItems.value - 1);
};
const moveUp = () => {
  activeIdx.value = Math.max(activeIdx.value - 1, 0);
};

// Position dropdown absolutely below the input (handles scrolled pages)
const updateDropdownPosition = () => {
  if (!rootRef.value) return;
  const rect = rootRef.value.getBoundingClientRect();
  dropdownStyle.value = {
    position: "fixed",
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: 999999,
    maxHeight: "220px",
    overflowY: "auto",
  };
};

// Reposition on window scroll/resize
onMounted(() => {
  window.addEventListener("scroll", updateDropdownPosition, true);
  window.addEventListener("resize", updateDropdownPosition);
});
onUnmounted(() => {
  window.removeEventListener("scroll", updateDropdownPosition, true);
  window.removeEventListener("resize", updateDropdownPosition);
});
</script>

<style lang="scss" scoped>
.combo-root {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
  position: relative;
}

.combo-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.005em;
}

.combo-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  transition:
    border-color 0.18s,
    box-shadow 0.18s;
  &:focus-within,
  &.combo-wrap--open {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-soft);
  }
  &.combo-wrap--filled {
    border-color: #10b981;
  }
}

.combo-icon-left {
  position: absolute;
  inset-inline-start: 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  pointer-events: none;
  .combo-wrap:focus-within & {
    color: var(--primary);
  }
}

.combo-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  padding: 0.65rem 2.5rem 0.65rem 2.5rem;
  &::placeholder {
    color: var(--text-muted);
    font-weight: 400;
  }
}

.combo-clear {
  position: absolute;
  inset-inline-end: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  padding: 0;
  transition: color 0.15s;
  &:hover {
    color: #ef4444;
  }
}

.combo-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-soft);
  border-radius: 20px;
  padding: 5px 10px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary);
  width: fit-content;
}
.chip-check {
  color: #10b981;
}
.chip-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--primary);
  display: flex;
  padding: 0;
  margin-inline-start: 2px;
  &:hover {
    color: #ef4444;
  }
}

.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<style lang="scss">
/* Global — teleported dropdown lives outside scoped tree */
.combo-dropdown {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
  overflow-y: auto;
}
.combo-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary);
  text-align: start;
  transition: background 0.12s;
  &:hover,
  &.combo-item--active {
    background: var(--bg-elevated);
  }
  &--create {
    color: var(--primary);
    font-weight: 600;
  }
}
.combo-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.combo-item-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-inline-start: auto;
  flex-shrink: 0;
}
.combo-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}
</style>
