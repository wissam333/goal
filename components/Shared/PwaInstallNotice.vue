<template>
  <Transition name="pwa-slide">
    <div
      v-if="$pwa?.showInstallPrompt && !$pwa?.isPWAInstalled"
      class="pwa-notice"
    >
      <div class="pwa-notice-inner">
        <Icon name="mdi:cellphone-arrow-down" size="20" class="pwa-icon" />
        <div class="pwa-text">
          <div class="pwa-title">{{ $t('pwa.installNotice') }}</div>
        </div>
        <div class="pwa-actions">
          <button class="pwa-install-btn" @click="$pwa?.install()">
            {{ $t('pwa.install') }}
          </button>
          <button class="pwa-dismiss-btn" @click="$pwa?.cancelInstall()">
            <Icon name="mdi:close" size="18" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.pwa-notice {
  position: fixed;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 0 16px;
  pointer-events: none;
}
.pwa-notice-inner {
  pointer-events: all;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  box-shadow: 0 6px 24px rgba(0,0,0,0.15);
}
:root.dark .pwa-notice-inner {
  box-shadow: 0 6px 24px rgba(0,0,0,0.4);
}
.pwa-icon {
  flex-shrink: 0;
  color: var(--primary);
}
.pwa-text {
  flex: 1;
}
.pwa-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}
.pwa-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.pwa-install-btn {
  padding: 7px 14px;
  border: none;
  border-radius: 9px;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.pwa-dismiss-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 7px;
  background: var(--bg-elevated);
  color: var(--text-muted);
  cursor: pointer;
}
.pwa-dismiss-btn:hover {
  color: var(--text-primary);
}
.pwa-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.pwa-slide-leave-active {
  transition: all 0.2s ease;
}
.pwa-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.pwa-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
