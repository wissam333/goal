<template>
  <div v-if="show" class="pwa-notice">
    <p class="pwa-notice-text">
      <Icon name="mdi:cellphone-arrow-down" size="20" />
      {{ $t('pwa.installNotice') }}
    </p>
    <div class="pwa-notice-actions">
      <button v-if="deferredPrompt" class="pwa-install-btn" @click="install">
        {{ $t('pwa.install') }}
      </button>
      <button class="pwa-dismiss-btn" @click="dismiss">
        <Icon name="mdi:close" size="18" />
      </button>
    </div>
  </div>
</template>

<script setup>
const show = ref(true)
const deferredPrompt = ref(null)

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
  })
})

const install = async () => {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const result = await deferredPrompt.value.userChoice
  if (result.outcome === 'accepted') {
    show.value = false
  }
  deferredPrompt.value = null
}

const dismiss = () => {
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
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  max-width: calc(100vw - 32px);
  white-space: nowrap;
  direction: ltr;
}
:root.dark .pwa-notice {
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.pwa-notice-text {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
}
.pwa-notice-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pwa-install-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.pwa-dismiss-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.pwa-dismiss-btn:hover {
  background: rgba(0,0,0,0.05);
}
:root.dark .pwa-dismiss-btn:hover {
  background: rgba(255,255,255,0.1);
}
</style>
