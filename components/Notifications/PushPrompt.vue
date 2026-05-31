<template>
  <div v-if="visible" class="push-prompt" :class="{ denied: isDenied }">
    <p class="push-prompt-text">
      {{ isDenied ? '🔕 تم رفض الإشعارات. فعّلها من إعدادات المتصفح لتحصل على التحديثات الفورية.' : $t('notifications.pushPrompt') }}
    </p>
  </div>
</template>

<script setup>
const push = usePushNotifications()
const dismissed = ref(false)
const hasAutoAsked = ref(false)

const isDenied = computed(() => push.supported && push.permission === 'denied')

const visible = computed(() => {
  if (!push.supported || dismissed.value) return false
  if (push.permission === 'denied') return true
  return push.permission === 'default' && !hasAutoAsked.value
})

async function tryAutoSubscribe() {
  if (!push.supported || push.permission !== 'default' || hasAutoAsked.value) return
  hasAutoAsked.value = true
  const result = await push.requestPermission()
  if (result === 'granted') {
    await push.subscribe()
  }
}

onMounted(() => {
  setTimeout(tryAutoSubscribe, 1000)
})
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
  gap: 12px;
}
.push-prompt.denied {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
}
.push-prompt-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-primary);
  flex: 1;
  text-align: center;
}
</style>
