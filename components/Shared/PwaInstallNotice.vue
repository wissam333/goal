<template>
  <div v-if="show" class="pwa-notice">
    <div class="pwa-notice-inner">
      <Icon name="mdi:cellphone-arrow-down" size="20" class="pwa-icon" />
      <div class="pwa-text">{{ $t('pwa.installNotice') }}</div>
      <button class="pwa-install-btn" @click="install">
        {{ $t('pwa.install') }}
      </button>
      <button class="pwa-close" @click="show = false">
        <Icon name="mdi:close" size="18" />
      </button>
    </div>
  </div>
</template>

<script setup>
const show = ref(false)
let deferredPrompt = null

if (import.meta.client) {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  if (isMobile) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      show.value = true
    })
    setTimeout(() => { if (!show.value) show.value = true }, 3000)
  }
}

const install = () => {
  if (deferredPrompt) deferredPrompt.prompt()
  show.value = false
}
</script>

<style scoped>
.pwa-notice {
  position: fixed;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}
.pwa-notice-inner {
  pointer-events: all;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  box-shadow: 0 6px 24px rgba(0,0,0,0.15);
  white-space: nowrap;
}
:root.dark .pwa-notice-inner {
  box-shadow: 0 6px 24px rgba(0,0,0,0.4);
}
.pwa-icon {
  flex-shrink: 0;
  color: var(--primary);
}
.pwa-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.pwa-install-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}
.pwa-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.pwa-close:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}
</style>
