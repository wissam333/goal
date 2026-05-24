<!-- components/Shared/Ui/ExitConfirmModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="exit-overlay" @click.self="cancel">
        <div class="exit-modal">
          <Icon name="mdi:exit-to-app" size="36" class="exit-icon" />
          <h3 class="exit-title">{{ $t("exit_title") }}</h3>
          <p class="exit-subtitle">{{ $t("exit_subtitle") }}</p>
          <div class="exit-actions">
            <button class="btn-cancel" @click="cancel">
              {{ $t("cancel") }}
            </button>
            <button class="btn-exit" @click="confirm">{{ $t("exit") }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
});
const emit = defineEmits(["confirm", "cancel"]);

const confirm = () => emit("confirm");
const cancel = () => emit("cancel");
</script>

<style lang="scss" scoped>
.exit-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end; // sheet from bottom — feels native
  justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}

.exit-modal {
  background: var(--bg-surface);
  border-radius: 20px 20px 0 0;
  padding: 2rem 1.5rem 2.5rem;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.18);
}

.exit-icon {
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.exit-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.exit-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
  text-align: center;
}

.exit-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.5rem;

  button {
    flex: 1;
    padding: 0.75rem;
    border-radius: 12px;
    border: none;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: opacity 0.15s;
    &:active {
      opacity: 0.75;
    }
  }
}

.btn-cancel {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.btn-exit {
  background: var(--primary);
  color: white;
}

// Transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
