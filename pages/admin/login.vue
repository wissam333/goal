<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-icon">
        <Icon name="mdi:shield-lock-outline" size="40" />
      </div>
      <h1 class="login-title">لوحة التحكم</h1>
      <p class="login-sub">دخول المسؤول</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <SharedUiFormBaseInput
          v-model="password"
          type="password"
          label="كلمة المرور"
          placeholder="أدخل كلمة المرور"
          :error="error"
          size="lg"
          required
        />
        <SharedUiButtonBase
          type="submit"
          variant="primary"
          size="lg"
          :loading="loading"
          class="login-btn"
        >
          دخول
        </SharedUiButtonBase>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const auth = useAdminAuth()
const password = ref("")
const error = ref("")
const loading = ref(false)

onMounted(() => {
  if (auth.checkSession()) navigateTo("/admin")
})

const handleLogin = () => {
  if (!password.value) return
  error.value = ""
  const result = auth.login(password.value)
  if (result.error) error.value = result.error
  else navigateTo("/admin")
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
  padding: 20px;
}
.login-card {
  width: 100%;
  max-width: 380px;
  background: var(--bg-surface);
  border-radius: 20px;
  padding: 40px 28px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color);
}
.login-icon {
  width: 72px; height: 72px;
  display: flex; align-items: center; justify-content: center;
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 18px;
  margin: 0 auto 16px;
}
.login-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}
.login-sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0 0 28px;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: start;
}
.login-btn {
  width: 100%;
  margin-top: 4px;
}
</style>
