<template>
  <div v-if="showBanner" class="push-prompt">
    <p class="push-prompt-text">{{ $t('notifications.pushPrompt') }}</p>
    <div class="push-prompt-actions">
      <button class="push-btn allow" @click="enable">
        {{ $t('notifications.allow') }}
      </button>
      <button class="push-btn later" @click="dismiss">
        {{ $t('notifications.later') }}
      </button>
    </div>
    
  </div>
</template>

<script setup>
const push = usePushNotifications()
const dismissed = ref(false)

const showBanner = computed(() =>
  push.supported && push.permission === 'default' && !dismissed.value
)

async function enable() {
  const result = await push.requestPermission()
  if (result === 'granted') {
    await push.subscribe()
  }
  dismissed.value = true
}

function dismiss() {
  dismissed.value = true
}
</script>

<style scoped>
.push-prompt {
  padding: 12px 16px;
  margin: 8px 12px;
  background: var(--primary-soft, rgba(34,197,94,0.1));
  border: 1px solid var(--primary-mid, rgba(34,197,94,0.2));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.push-prompt-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-primary);
  flex: 1;
}
.push-prompt-actions {
  display: flex;
  gap: 8px;
}
.push-btn {
  padding: 6px 16px;
  border-radius: 8px;
  border: none;
  font-size: 0.8125rem;
  cursor: pointer;
  font-weight: 500;
}
.push-btn.allow {
  background: var(--primary, #22c55e);
  color: #fff;
}
.push-btn.later {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color, #e2e8f0);
}
</style>
