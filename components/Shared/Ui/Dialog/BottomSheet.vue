<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div
        class="bottom-sheet-wrapper"
        v-if="modelValue"
        :class="$i18n.locale === 'ar' ? 'ar' : 'en'"
      >
        <div class="bottom-sheet-overlay" @click.self="closeDialog">
          <div
            class="bottom-sheet"
            :style="{ maxWidth: maxWidth }"
            role="dialog"
            aria-modal="true"
          >
            <div class="bottom-sheet-header">
              <div class="drag-handle"></div>
              <h3>{{ title }}</h3>
              <button
                class="close-btn"
                @click="closeDialog"
                :aria-label="$t('close_dialog')"
              >
                <Icon name="mdi:close" size="20" />
              </button>
            </div>

            <div class="bottom-sheet-content">
              <slot></slot>
            </div>

            <div class="bottom-sheet-actions" v-if="$slots.actions">
              <slot name="actions"></slot>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "",
  },
  maxWidth: {
    type: String,
    default: "600px",
  },
  persistent: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const closeDialog = () => {
  if (!props.persistent) {
    emit("update:modelValue", false);
  }
};

// useBackButton removed — no longer needed

// Handle escape key
const handleEscape = (e) => {
  if (e.key === "Escape" && props.modelValue) {
    closeDialog();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscape);
});

// Prevent body scroll when modal is open
watch(
  () => props.modelValue,
  (isOpen) => {
    if (import.meta.client) {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.bottom-sheet-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  font-family: "Tajawal", sans-serif;

  &.ar {
    direction: rtl;
    .close-btn {
      left: 1.5rem;
      right: auto;
    }
    .drag-handle {
      left: 50%;
      right: auto;
      transform: translateX(-50%);
    }
  }
  &.en {
    direction: ltr;
  }
}

.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 10001;
  padding: 0;
}

.bottom-sheet {
  position: relative;
  z-index: 10002;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-bottom: none;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.18);
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

// ── Header ────────────────────────────────────────────────────────────────────
.bottom-sheet-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-elevated);
  flex-shrink: 0;
  min-height: 60px;

  h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.4;
    padding: 0 44px;
    text-align: center;
  }
}

// ── Drag handle ───────────────────────────────────────────────────────────────
.drag-handle {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: var(--border-color);
  border-radius: 99px;
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
}

// ── Close button ──────────────────────────────────────────────────────────────
.close-btn {
  position: absolute;
  right: 1.5rem;
  top: 1.5rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: var(--primary-soft);
    border-color: var(--primary);
    color: var(--primary);
    transform: scale(1.05);
  }
  &:active {
    transform: scale(0.93);
  }
  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
}

// ── Content ───────────────────────────────────────────────────────────────────
.bottom-sheet-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
  max-height: calc(85vh - 130px);
  color: var(--text-primary);

  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 99px;
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────
.bottom-sheet-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-elevated);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

// ── Transition ────────────────────────────────────────────────────────────────
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

// ── Focus ─────────────────────────────────────────────────────────────────────
.bottom-sheet:focus {
  outline: none;
}

// ── Mobile ────────────────────────────────────────────────────────────────────
@media (max-width: 600px) {
  .bottom-sheet-wrapper {
    padding: 0;
  }

  .bottom-sheet {
    max-height: 90vh;
    border-radius: 20px 20px 0 0;
  }

  .bottom-sheet-header {
    padding: 1.25rem 1rem 1rem;
    h3 {
      font-size: 1.1rem;
      padding: 0 38px;
    }
  }

  .drag-handle {
    width: 50px;
  }

  .close-btn {
    right: 1rem;
    top: 1.25rem;
  }

  .bottom-sheet-content {
    padding: 1rem;
  }

  .bottom-sheet-actions {
    padding: 0.75rem 1rem;
    flex-direction: column-reverse;
    gap: 0.5rem;
    > * {
      width: 100%;
    }
  }
}
</style>
