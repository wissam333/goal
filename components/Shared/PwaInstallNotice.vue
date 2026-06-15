<template>
  <Transition name="pwa-slide">
    <div v-if="visible" class="pwa-notice">
      <div class="pwa-content">
        <!-- In-app browser (Facebook, Messenger, Instagram, etc.) -->
        <template v-if="isInApp">
          <div class="pwa-icon">
            <Icon name="mdi:open-in-new" size="22" />
          </div>
          <div class="pwa-text">
            <strong>{{ $t("pwa.inapp") }}</strong>
          </div>
        </template>

        <!-- iOS -->
        <template v-else-if="platform === 'ios'">
          <div class="pwa-icon">
            <Icon name="mdi:apple" size="24" />
          </div>
          <div class="pwa-text">
            <strong>{{ $t("pwa.install") }}</strong>
            <span>
              {{ $t("pwa.ios_hint_before") }}
              <Icon name="mdi:export-variant" size="13" class="inline-icon" />
              {{ $t("pwa.ios_hint_after") }}
            </span>
          </div>
        </template>

        <!-- Android / Chrome — prompt available -->
        <template v-else-if="platform === 'android' && isInstallable">
          <div class="pwa-icon">
            <Icon name="mdi:cellphone-arrow-down" size="24" />
          </div>
          <div class="pwa-text">
            <strong>{{ $t("pwa.install") }}</strong>
            <span>{{ $t("pwa.android_hint") }}</span>
          </div>
          <button
            class="pwa-install-btn"
            :class="{ loading: installing }"
            :disabled="installing"
            @click="handleInstall"
          >
            <Icon v-if="installing" name="mdi:loading" size="15" class="spin" />
            <span v-else>{{ $t("pwa.install_btn") }}</span>
          </button>
        </template>

        <!-- Android — prompt not available (fallback) -->
        <template v-else-if="platform === 'android' && !isInstallable">
          <div class="pwa-icon">
            <Icon name="mdi:dots-vertical" size="24" />
          </div>
          <div class="pwa-text">
            <strong>{{ $t("pwa.install") }}</strong>
            <span>{{ $t("pwa.android_manual_hint") }}</span>
          </div>
        </template>

        <button
          class="pwa-close"
          :aria-label="$t('pwa.dismiss')"
          @click="dismiss"
        >
          <Icon name="mdi:close" size="18" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const visible = ref(false);
const platform = ref<"ios" | "android" | "desktop">("desktop");
const installing = ref(false);
const isInApp = ref(false);

const { isInstallable, install, dismiss: pwaCancel } = usePwaInstall();

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  !!(window.navigator as any).standalone;

const detectPlatform = (): "ios" | "android" | "desktop" => {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
};

const detectInAppBrowser = (): boolean => {
  const ua = navigator.userAgent;
  if (/WhatsApp/i.test(ua)) return true;
  return /FBAN|FBAV|Messenger|FB_IAB|FB4A|Instagram|MicroMessenger|Line/i.test(
    ua,
  );
};

const dismiss = () => {
  visible.value = false;
  // do NOT call pwaCancel() — it sets localStorage and kills the listener forever
  // just hide the banner for this session
};

const handleInstall = async () => {
  installing.value = true;
  try {
    const accepted = await install();
    if (accepted) visible.value = false;
  } finally {
    installing.value = false;
  }
};

onMounted(() => {
  if (isStandalone()) return;

  const inApp = detectInAppBrowser();
  if (inApp) {
    isInApp.value = true;
    visible.value = true;
    return;
  }

  const p = detectPlatform();
  if (p === "desktop") return;

  platform.value = p;
  visible.value = true;
});

// upgrade from manual hint to install button once prompt becomes available
watch(isInstallable, (val) => {
  if (val && platform.value === "android") {
    visible.value = true;
  }
});
</script>

<style scoped>
.pwa-notice {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 0 12px 16px;
  padding-bottom: max(env(safe-area-inset-bottom, 0px), 16px);
  pointer-events: none;
}

.pwa-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  pointer-events: auto;
  max-width: 420px;
  margin: 0 auto;
}

.pwa-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pwa-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.pwa-text strong {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 600;
}

.pwa-text span {
  display: flex;
  align-items: center;
  gap: 3px;
  color: var(--text-muted);
  font-size: 0.775rem;
  line-height: 1.4;
}

.inline-icon {
  vertical-align: middle;
  flex-shrink: 0;
}

.pwa-install-btn {
  flex-shrink: 0;
  padding: 7px 18px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  min-width: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}

.pwa-install-btn:hover:not(:disabled) {
  opacity: 0.88;
}

.pwa-install-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pwa-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color 0.15s,
    background 0.15s;
}

.pwa-close:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.spin {
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.pwa-slide-enter-active,
.pwa-slide-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.25s ease;
}

.pwa-slide-enter-from,
.pwa-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
