<template>
  <div class="error-page">
    <div class="error-wrap">
      <Icon
        :name="error.statusCode === 404 ? 'mdi:search-web' : 'mdi:alert-circle-outline'"
        size="64"
        class="error-icon"
      />
      <h1 class="error-code">{{ error.statusCode }}</h1>
      <p class="error-msg">
        {{ error.statusCode === 404 ? 'الصفحة غير موجودة' : 'حدث خطأ ما' }}
      </p>
      <button class="error-btn" @click="handleClearError">
        <Icon name="mdi:home-outline" size="18" />
        العودة للرئيسية
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ error: Object });

const handleClearError = () => clearError({ redirect: "/" });

useHead({
  title: `خطأ ${props.error.statusCode}`,
  meta: [{ name: "robots", content: "noindex" }],
});
</script>

<style lang="scss" scoped>
.error-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
  padding: 20px;
}

.error-wrap {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.error-icon {
  color: var(--primary);
  opacity: 0.5;
}

.error-code {
  font-size: 4rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
  line-height: 1;
}

.error-msg {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin: 0;
}

.error-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: color-mix(in srgb, var(--primary) 85%, #000);
  }
}
</style>
