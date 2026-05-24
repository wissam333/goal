<!-- components/shared/Ui/Feedback/Toast.vue -->
<template>
  <teleport to="body">
    <div
      class="toast-container"
      :class="[position, { rtl: $i18n.locale === 'ar' }]"
    >
      <transition-group name="toast" tag="div" class="toast-stack">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
          :class="`toast--${toast.type}`"
          @mouseenter="pauseTimer(toast.id)"
          @mouseleave="resumeTimer(toast.id)"
          @touchstart="pauseTimer(toast.id)"
          @touchend="resumeTimer(toast.id)"
          role="alert"
          aria-live="assertive"
        >
          <div class="toast-inner">
            <!-- Icon -->
            <div class="toast-icon-wrap">
              <Icon :name="getIcon(toast.type)" :size="22" />
            </div>

            <!-- Text -->
            <div class="toast-text-group">
              <p v-if="toast.title" class="toast-title">
                {{ $t(toast.title) }}
              </p>
              <p class="toast-message">{{ $t(toast.message) }}</p>
            </div>

            <!-- Dismiss -->
            <button
              class="toast-dismiss"
              @click="$toast.remove(toast.id)"
              :aria-label="$t('close')"
            >
              <Icon name="mdi:close" size="16" />
            </button>
          </div>

          <!-- Progress bar -->
          <div
            v-if="toast.duration > 0"
            class="toast-progress"
            :style="{
              animationDuration: `${toast.duration}ms`,
              animationPlayState: toast.paused ? 'paused' : 'running',
            }"
          />
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
import { useNuxtApp } from "#app";
import { ref } from "vue";

const { $toastState, $toast, $i18n } = useNuxtApp();

defineProps({
  duration: {
    type: Number,
    default: 3000,
  },
  position: {
    type: String,
    default: "top-right",
    validator: (v) =>
      [
        "top-right",
        "top-left",
        "bottom-right",
        "bottom-left",
        "top-center",
        "bottom-center",
        "center",
      ].includes(v),
  },
});

const toasts = $toastState || ref([]);

const getIcon = (type) =>
  ({
    success: "mdi:check-circle",
    error: "mdi:close-circle",
    warning: "mdi:alert-circle",
    info: "mdi:information",
  })[type] ?? "mdi:information";

const pauseTimer = (id) => {
  const t = toasts.value.find((t) => t.id === id);
  if (t) t.paused = true;
};
const resumeTimer = (id) => {
  const t = toasts.value.find((t) => t.id === id);
  if (t) t.paused = false;
};
</script>

<style scoped lang="scss">
/* ── Tokens ──────────────────────────────────────────────────── */

/* ── Container ───────────────────────────────────────────────── */
.toast-container {
  --toast-success-bg: #2d8c6b;
  --toast-success-dark: #1f6e52;
  --toast-success-light: #b2e8d4;

  --toast-error-bg: #cc3333;
  --toast-error-dark: #a82828;
  --toast-error-light: #f5b8b8;

  --toast-warning-bg: #c97a1a;
  --toast-warning-dark: #a86214;
  --toast-warning-light: #fce4b0;

  --toast-info-bg: #2c5fcc;
  --toast-info-dark: #1e48a8;
  --toast-info-light: #c2d0f8;
  --toast-radius: 14px;
  --toast-width: 300px;

  position: fixed;
  z-index: 9999;
  padding: 1.25rem;
  pointer-events: none;
  font-family: "Tajawal", "sans-serif";

  &.top-right {
    top: 0;
    right: 0;
  }
  &.top-left {
    top: 0;
    left: 0;
  }
  &.top-center {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }
  &.bottom-right {
    bottom: 0;
    right: 0;
  }
  &.bottom-left {
    bottom: 0;
    left: 0;
  }
  &.bottom-center {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }
  &.center {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &.bottom-right .toast-stack,
  &.bottom-left .toast-stack,
  &.bottom-center .toast-stack {
    flex-direction: column-reverse;
  }

  &.top-center .toast-stack,
  &.bottom-center .toast-stack {
    align-items: center;
  }
  &.top-left .toast-stack,
  &.bottom-left .toast-stack {
    align-items: flex-start;
  }
}

/* ── Stack ───────────────────────────────────────────────────── */
.toast-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: var(--toast-width);
  max-width: calc(100vw - 2.5rem);
  align-items: flex-end;
}

/* ── Item ────────────────────────────────────────────────────── */
.toast-item {
  width: 100%;
  pointer-events: auto;
  border-radius: var(--toast-radius);
  overflow: hidden;
  position: relative;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 1px 4px rgba(0, 0, 0, 0.12);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
  cursor: default;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 10px 28px rgba(0, 0, 0, 0.24),
      0 2px 8px rgba(0, 0, 0, 0.14);
  }

  &.toast--success {
    --bg: var(--toast-success-bg);
    --bg-dark: var(--toast-success-dark);
    --fg: #fff;
    --fg-soft: rgba(255, 255, 255, 0.82);
    --progress: var(--toast-success-light);
  }
  &.toast--error {
    --bg: var(--toast-error-bg);
    --bg-dark: var(--toast-error-dark);
    --fg: #fff;
    --fg-soft: rgba(255, 255, 255, 0.82);
    --progress: var(--toast-error-light);
  }
  &.toast--warning {
    --bg: var(--toast-warning-bg);
    --bg-dark: var(--toast-warning-dark);
    --fg: #fff;
    --fg-soft: rgba(255, 255, 255, 0.82);
    --progress: var(--toast-warning-light);
  }
  &.toast--info {
    --bg: var(--toast-info-bg);
    --bg-dark: var(--toast-info-dark);
    --fg: #fff;
    --fg-soft: rgba(255, 255, 255, 0.82);
    --progress: var(--toast-info-light);
  }

  background: var(--bg);
}

/* ── Inner layout ────────────────────────────────────────────── */
.toast-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.125rem 1.25rem;
  /* Subtle top-left sheen — adds depth without glass */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 55%
  );
}

/* ── Icon ────────────────────────────────────────────────────── */
.toast-icon-wrap {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--bg-dark);
  color: var(--fg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 2px 4px rgba(0, 0, 0, 0.2);
}

/* ── Text ────────────────────────────────────────────────────── */
.toast-text-group {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--fg);
  margin: 0 0 0.2rem;
  line-height: 1.3;
}

.toast-message {
  font-size: 0.8375rem;
  color: var(--fg-soft);
  margin: 0;
  line-height: 1.55;
}

/* ── Dismiss ─────────────────────────────────────────────────── */
.toast-dismiss {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--fg);
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.1s;
  margin-left: 0.25rem;

  &:hover {
    background: rgba(0, 0, 0, 0.28);
  }
  &:active {
    transform: scale(0.9);
  }
}

/* ── Progress ────────────────────────────────────────────────── */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--progress);
  opacity: 0.6;
  animation: toast-progress linear forwards;
}

@keyframes toast-progress {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

/* ── Animations ──────────────────────────────────────────────── */
.toast-enter-active {
  animation: toast-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.toast-leave-active {
  animation: toast-out 0.22s ease-in forwards;
  pointer-events: none;
}
.toast-move {
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translateX(36px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
@keyframes toast-out {
  0% {
    opacity: 1;
    transform: scale(1);
    max-height: 120px;
    margin-bottom: 0;
  }
  100% {
    opacity: 0;
    transform: scale(0.94);
    max-height: 0;
    margin-bottom: -0.75rem;
  }
}

/* ── RTL ─────────────────────────────────────────────────────── */
.rtl {
  .toast-inner {
    flex-direction: row-reverse;
  }
  .toast-dismiss {
    margin-left: 0;
    margin-right: 0.25rem;
  }
  .toast-progress {
    left: auto;
    right: 0;
  }
  .toast-enter-active {
    animation-name: toast-in-rtl;
  }
  .toast-leave-active {
    animation-name: toast-out-rtl;
  }
}

@keyframes toast-in-rtl {
  0% {
    opacity: 0;
    transform: translateX(-36px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
@keyframes toast-out-rtl {
  0% {
    opacity: 1;
    transform: scale(1);
    max-height: 120px;
  }
  100% {
    opacity: 0;
    transform: scale(0.94);
    max-height: 0;
  }
}

/* ── Mobile ──────────────────────────────────────────────────── */
@media (max-width: 520px) {
  .toast-container {
    padding: 0.75rem;
  }
  .toast-stack {
    width: 100%;
    max-width: 100%;
  }
  .toast-inner {
    padding: 1rem;
    gap: 0.75rem;
  }
  .toast-icon-wrap {
    width: 38px;
    height: 38px;
  }
  .toast-title {
    font-size: 0.875rem;
  }
  .toast-message {
    font-size: 0.8rem;
  }
}
</style>
