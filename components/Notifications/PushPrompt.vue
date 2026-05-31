<template>
  <div v-if="visible" class="push-prompt denied">
    <p class="push-prompt-text">
      🔕 تم رفض الإشعارات. فعّلها من إعدادات المتصفح لتحصل على التحديثات الفورية.
    </p>
  </div>
</template>

<script setup>
const push = usePushNotifications()

const visible = computed(() =>
  push.supported && push.permission === 'denied'
)
</script>

<style scoped>
.push-prompt {
  padding: 12px 16px;
  margin: 8px 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.push-prompt-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-primary);
  flex: 1;
  text-align: center;
}
</style>
