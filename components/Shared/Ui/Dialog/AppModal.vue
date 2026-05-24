<!-- components/Shared/Ui/Dialog/AppModal.vue -->
<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div
        v-if="modelValue"
        class="modal-wrapper"
        :class="$i18n.locale === 'ar' ? 'ar' : 'en'"
      >
        <div class="modal-overlay" @click.self="closeDialog">
          <div
            class="modal-box"
            :style="{ maxWidth }"
            role="dialog"
            aria-modal="true"
          >
            <!-- Header -->
            <div class="modal-header">
              <h3>{{ title }}</h3>
              <button
                class="close-btn"
                @click="closeDialog"
                :aria-label="$t('close_dialog')"
              >
                <Icon name="mdi:close" size="18" />
              </button>
            </div>

            <!-- Body -->
            <div class="modal-content">
              <slot />
            </div>

            <!-- Actions -->
            <div v-if="$slots.actions" class="modal-actions">
              <slot name="actions" />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: "" },
  maxWidth: { type: String, default: "600px" },
  persistent: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const closeDialog = () => {
  if (!props.persistent) emit("update:modelValue", false);
};

const { pushHandler, popHandler } = useBackButton();

// Stable reference — defined once, not recreated
const backHandler = () => closeDialog();

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) pushHandler(backHandler);
    else popHandler(backHandler); // still needed for when user closes via X button
  },
);

onUnmounted(() => popHandler(backHandler));

const handleEscape = (e) => {
  if (e.key === "Escape" && props.modelValue) closeDialog();
};

onMounted(() => document.addEventListener("keydown", handleEscape));
onUnmounted(() => document.removeEventListener("keydown", handleEscape));

watch(
  () => props.modelValue,
  (isOpen) => {
    if (import.meta.client)
      document.body.style.overflow = isOpen ? "hidden" : "";
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
// ── Wrapper ───────────────────────────────────────────────────────────────────
.modal-wrapper {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  font-family: "Tajawal", sans-serif;

  &.ar {
    direction: rtl;
    .close-btn {
      right: auto;
      left: 1.25rem;
    }
  }
  &.en {
    direction: ltr;
  }
}

// ── Overlay ───────────────────────────────────────────────────────────────────
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 1rem;
}

// ── Box ───────────────────────────────────────────────────────────────────────
.modal-box {
  position: relative;
  z-index: 10002;
  background: var(--bg-surface); // ← was white
  border: 1px solid var(--border-color); // ← new — visible in dark mode
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

// ── Header ────────────────────────────────────────────────────────────────────
.modal-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid var(--border-color); // ← was #e0e0e0
  flex-shrink: 0;
  min-height: 60px;
  background: var(--bg-elevated); // ← subtle tint vs body

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary); // ← was #2c3e50
    text-align: center;
    padding: 0 44px;
    line-height: 1.3;
  }
}

// ── Close button ──────────────────────────────────────────────────────────────
.close-btn {
  position: absolute;
  right: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page); // ← was #f1f5f9
  border: 1px solid var(--border-color); // ← new — defined edge
  border-radius: 50%;
  color: var(--text-muted); // ← was #64748b
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: var(--primary-soft); // ← was #e2e8f0
    border-color: var(--primary); // ← accent on hover
    color: var(--primary); // ← was #0c1739
    transform: translateY(-50%) scale(1.05);
  }
  &:active {
    transform: translateY(-50%) scale(0.93);
  }
  &:focus-visible {
    outline: 2px solid var(--primary); // ← was hardcoded gold
    outline-offset: 2px;
  }
}

// ── Content ───────────────────────────────────────────────────────────────────
.modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
  color: var(--text-primary); // ← ensures dark mode text

  // Subtle scrollbar
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
.modal-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color); // ← was #e0e0e0
  background: var(--bg-elevated); // ← matches header tint
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
  transition: opacity 0.22s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

// ── Mobile — sheet style ──────────────────────────────────────────────────────
@media (max-width: 600px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .modal-box {
    border-radius: 18px 18px 0 0;
    max-height: 90vh;
    // Drag handle hint
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

  .modal-header {
    padding-top: 0.75rem;
    h3 {
      font-size: 1rem;
    }
  }

  .modal-content {
    padding: 1rem;
  }

  .modal-actions {
    padding: 0.75rem 1rem;
    flex-direction: column-reverse;
    gap: 0.5rem;
    > * {
      width: 100%;
    }
  }
}
</style>
