<template>
  <div v-if="visible" class="pwa-notice">
    <div class="pwa-content">
      <template v-if="platform === 'ios'">
        <Icon name="mdi:apple" size="22" />
        <div class="pwa-text">
          <strong>تثبيت التطبيق</strong>
          <span>اضغط مشاركة <Icon name="mdi:share-variant" size="14" /> ثم أضف إلى الشاشة الرئيسية</span>
        </div>
      </template>
      <template v-else-if="platform === 'android'">
        <Icon name="mdi:google-chrome" size="22" />
        <div class="pwa-text">
          <strong>تثبيت التطبيق</strong>
          <span>حمّل التطبيق لتصفح أسرع</span>
        </div>
        <button class="pwa-install-btn" @click="install">تثبيت</button>
      </template>
      <button class="pwa-close" @click="dismiss">&times;</button>
    </div>
  </div>
</template>

<script setup>
const dismissed = ref(false)
const platform = ref('')
const visible = ref(false)
const deferredPrompt = ref(null)

const LS_KEY = 'pwa-install-dismissed'

const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone
}

const detectPlatform = () => {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

const dismiss = () => {
  dismissed.value = true
  visible.value = false
  try { localStorage.setItem(LS_KEY, '1') } catch {}
}

const install = async () => {
  const prompt = deferredPrompt.value
  if (prompt) {
    prompt.prompt()
    const result = await prompt.userChoice
    deferredPrompt.value = null
    if (result.outcome === 'accepted') dismiss()
    return
  }
  try {
    const { $pwa } = useNuxtApp()
    const showed = await $pwa.showInstallPrompt?.()
    if (showed) dismiss()
  } catch {}
}

onMounted(() => {
  if (isStandalone()) return
  try {
    if (localStorage.getItem(LS_KEY)) return
  } catch {}
  const p = detectPlatform()
  if (p === 'desktop') return
  platform.value = p
  visible.value = true

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
  })
})
</script>

<style scoped>
.pwa-notice {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 0 12px 16px;
  pointer-events: none;
}
.pwa-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  pointer-events: auto;
  max-width: 400px;
  margin: 0 auto;
}
.pwa-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  font-size: 0.82rem;
  color: var(--text-primary);
  strong { font-size: 0.9rem; }
  span {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-muted);
    font-size: 0.78rem;
  }
}
.pwa-install-btn {
  flex-shrink: 0;
  padding: 6px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.pwa-install-btn:hover {
  opacity: 0.9;
}
.pwa-close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 1.3rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}
.pwa-close:hover {
  color: var(--text-primary);
}
</style>
