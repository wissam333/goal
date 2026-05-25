<template>
  <transition name="dialog-fade">
    <div class="custom-dialog-wrapper" v-if="modelValue">
      <div class="custom-dialog-overlay" @click.self="closeDialog">
        <div
          class="custom-dialog"
          :style="{ maxWidth: maxWidth }"
          role="dialog"
          aria-modal="true"
        >
          <div class="custom-dialog-header">
            <h3>{{ title }}</h3>
            <button
              class="close-btn"
              @click="closeDialog"
              :aria-label="$t('close_dialog')"
            >
              <Icon name="mdi-close" />
            </button>
          </div>

          <div class="custom-dialog-content">
            <slot></slot>
          </div>

          <div class="custom-dialog-actions" v-if="$slots.actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
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
    default: "800px",
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
</script>

<style lang="scss" scoped>
.custom-dialog-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.custom-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.custom-dialog {
  font-family: "Tajawal", sans-serif;
  position: relative;
  z-index: 2;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow: 0 11px 15px -7px rgba(0, 0, 0, 0.2),
    0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12);
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ── Header ────────────────────────────────────────────────────────────────────
.custom-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-elevated);
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.4;
  }
}

// ── Close button ──────────────────────────────────────────────────────────────
.close-btn {
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
  flex-shrink: 0;
  transition: all 0.2s ease;

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
.custom-dialog-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
  max-height: calc(90vh - 130px);
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
.custom-dialog-actions {
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

// ── Transitions ───────────────────────────────────────────────────────────────
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .custom-dialog,
.dialog-fade-leave-active .custom-dialog {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.25s ease;
}
.dialog-fade-enter-from .custom-dialog,
.dialog-fade-leave-to .custom-dialog {
  transform: scale(0.95) translateY(-10px);
  opacity: 0;
}

// ── Focus ─────────────────────────────────────────────────────────────────────
.custom-dialog:focus {
  outline: none;
}

// ── Mobile ────────────────────────────────────────────────────────────────────
@media (max-width: 600px) {
  .custom-dialog-wrapper {
    padding: 0;
    align-items: flex-end;
  }

  .custom-dialog {
    width: 100%;
    max-height: 90vh;
    border-radius: 16px 16px 0 0;
    border-bottom: none;

    // drag handle hint
    &::before {
      content: "";
      display: block;
      width: 36px;
      height: 4px;
      background: var(--border-color);
      border-radius: 99px;
      margin: 10px auto 0;
      flex-shrink: 0;
    }
  }

  .custom-dialog-header,
  .custom-dialog-content,
  .custom-dialog-actions {
    padding: 1rem;
  }

  .custom-dialog-header {
    padding-top: 0.75rem;
  }

  .custom-dialog-actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
    > * {
      width: 100%;
    }
  }
}
</style>
