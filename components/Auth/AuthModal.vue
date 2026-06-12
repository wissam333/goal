<template>
  <Teleport to="body">
    <div v-if="show" class="test-auth-overlay" @click.self="authModal.close()">
      <div class="test-auth-dialog" @click.stop>
        <button @click="authModal.close()">✕</button>
        <h3>{{ tabTitle }}</h3>
        <p>{{ tab === 'login' ? $t('auth.loginSubtitle') : $t('auth.registerSubtitle') }}</p>
        <div class="auth-tabs" style="display:flex;gap:4px;background:var(--bg-elevated);border-radius:12px;padding:4px;margin-bottom:20px">
          <button :class="{ active: tab === 'login' }" @click="tab = 'login'" style="flex:1;padding:10px;border:none;border-radius:10px;background:transparent">
            {{ $t('auth.login') }}
          </button>
          <button :class="{ active: tab === 'register' }" @click="tab = 'register'" style="flex:1;padding:10px;border:none;border-radius:10px;background:transparent">
            {{ $t('auth.register') }}
          </button>
        </div>
        <div class="auth-tabs-nav"></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const { t } = useI18n()
const authModal = useAuthModal()
const auth = useAuth()

// Ensure modal starts closed (prevents stale useState from HMR)
authModal.show.value = false

const show = computed({
  get: () => authModal.show.value,
  set: (val) => { authModal.show.value = val }
})
const defaultTab = computed(() => authModal.defaultTab.value)

const tabTitle = computed(() =>
  tab.value === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')
)

const tab = ref(defaultTab.value)
const email = ref("")
const password = ref("")
const confirmPassword = ref("")
const error = ref("")
const success = ref("")
const loading = ref(false)
const googleLoading = ref(false)
const passwordError = ref("")

watch(defaultTab, (val) => { tab.value = val })

const handleGoogle = async () => {
  googleLoading.value = true
  await auth.signInWithGoogle()
  googleLoading.value = false
}

const handleSubmit = async () => {
  error.value = ""
  success.value = ""
  passwordError.value = ""
  loading.value = true

  if (tab.value === "register") {
    if (password.value !== confirmPassword.value) {
      error.value = t("auth.passwordMismatch")
      loading.value = false
      return
    }
    const { error: err } = await auth.signUp(email.value, password.value)
    loading.value = false
    if (err) {
      if (err.message?.includes("already registered")) {
        error.value = t("auth.emailInUse")
      } else if (err.message?.includes("weak")) {
        error.value = t("auth.weakPassword")
      } else {
        error.value = err.message || t("auth.emailInUse")
      }
      return
    }
    success.value = t("auth.registrationSuccess")
    tab.value = "login"
  } else {
    const { error: err } = await auth.signIn(email.value, password.value)
    loading.value = false
    if (err) {
      error.value = t("auth.loginError")
      return
    }
    authModal.close()
  }
}
</script>

<style lang="scss" scoped>
.test-auth-overlay {
  position: fixed; inset: 0; z-index: 99999;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
}
.test-auth-dialog {
  background: var(--bg-surface); padding: 32px;
  border-radius: 20px; max-width: 420px; width: 100%;
}

.auth-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}

.auth-tab {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &.active {
    background: var(--bg-surface);
    color: var(--text-primary);
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
}

.auth-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.auth-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  margin: 4px 0 20px;
}

.google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: var(--bg-surface); border-color: var(--primary-mid); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-error {
  color: #ef4444;
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
}

.auth-success {
  color: #22c55e;
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
}

.auth-submit {
  width: 100%;
  margin-top: 4px;
}

.auth-switch {
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 16px 0 0;
}

.auth-link {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.82rem;
  padding: 0;
  &:hover { text-decoration: underline; }
}
</style>
