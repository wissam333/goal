<template>
  <div class="install-page">
    <div class="install-card">
      <div class="install-logo">
        <img src="/logo.png" alt="دوري القرية" width="80" height="80" />
      </div>
      <h1 class="install-title">{{ appTitle || 'دوري القرية' }}</h1>
      <p class="install-desc">
        تابع المباريات، وصوت لأفضل لاعب، واستقبل الإشعارات فورياً
      </p>

      <!-- Install prompt section -->
      <div v-if="showInstall" class="install-action">
        <button
          class="install-btn"
          :class="{ loading: installing }"
          :disabled="installing"
          @click="handleInstall"
        >
          <Icon v-if="installing" name="mdi:loading" size="20" class="spin" />
          <template v-else>
            <Icon name="mdi:tray-arrow-down" size="20" />
            <span>تثبيت التطبيق</span>
          </template>
        </button>
        <p class="install-meta">مجاني · بدون إعلانات · إشعارات فورية</p>
      </div>

      <!-- In-app browser fallback -->
      <div v-else-if="isInApp" class="install-fallback">
        <p class="fallback-text">
          <template v-if="platform === 'ios'">
            انسخ الرابط وافتحه في Safari لتتمكن من تثبيت التطبيق
          </template>
          <template v-else>
            افتح الرابط في Chrome أو أي متصفح آخر لتتمكن من تثبيت التطبيق
          </template>
        </p>
        <button v-if="platform !== 'ios'" class="install-btn secondary" @click="openInBrowser">
          <Icon name="mdi:open-in-new" size="18" />
          <span>فتح في المتصفح</span>
        </button>
        <button v-else class="install-btn secondary" @click="copyLink">
          <Icon name="mdi:content-copy" size="18" />
          <span>نسخ الرابط</span>
        </button>
      </div>

      <!-- iOS instructions -->
      <div v-else-if="platform === 'ios'" class="install-fallback">
        <div class="ios-steps">
          <div class="ios-step">
            <span class="step-num">1</span>
            <Icon name="mdi:export-variant" size="20" />
            <span>اضغط على زر المشاركة</span>
          </div>
          <div class="ios-step">
            <span class="step-num">2</span>
            <Icon name="mdi:plus-box" size="20" />
            <span>اختر "إضافة إلى الشاشة الرئيسية"</span>
          </div>
          <div class="ios-step">
            <span class="step-num">3</span>
            <Icon name="mdi:check" size="20" />
            <span>تم! التطبيق على شاشتك</span>
          </div>
        </div>
      </div>

      <!-- Already installed -->
      <div v-else-if="isStandalone" class="install-fallback">
        <p class="fallback-text">التطبيق مثبت بالفعل! 🎉</p>
      </div>

      <!-- Bottom link -->
      <NuxtLink to="/" class="install-home-link">
        <Icon name="mdi:arrow-right" size="16" />
        الصفحة الرئيسية
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false });

const { locale } = useI18n();
const { name: appTitle } = useAppTitle();
const siteUrl = "https://goal-safita.vercel.app";

const installing = ref(false);
const platform = ref("desktop");
const isInApp = ref(false);
const showInstall = ref(false);
const isStandalone = ref(false);

const { isInstallable, install } = usePwaInstall();

const isStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  !!window.navigator.standalone;

const detectPlatform = () => {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
};

const detectInAppBrowser = () => {
  const ua = navigator.userAgent;
  // WhatsApp WebView has "WhatsApp" in UA
  // Telegram's WebView supports beforeinstallprompt so we let it through
  if (/WhatsApp/i.test(ua)) return true;
  return /FBAN|FBAV|Messenger|FB_IAB|FB4A|Instagram|MicroMessenger|Line/i.test(
    ua,
  );
};

const handleInstall = async () => {
  installing.value = true;
  try {
    const accepted = await install();
    if (accepted) {
      showInstall.value = false;
    }
  } finally {
    installing.value = false;
  }
};

const copyLink = () => {
  navigator.clipboard.writeText(siteUrl);
};

const openInBrowser = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) {
    window.location.href = `intent://${siteUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
  } else {
    window.open(siteUrl, "_blank");
  }
};

onMounted(() => {
  isStandalone.value = isStandaloneMode();
  if (isStandalone.value) return;

  isInApp.value = detectInAppBrowser();
  if (isInApp.value) return;

  platform.value = detectPlatform();
  if (platform.value === "desktop") return;

  if (platform.value === "android" && isInstallable.value) {
    showInstall.value = true;
  }
});

// Also watch for isInstallable becoming true (may fire after page load)
watch(isInstallable, (val) => {
  if (val && platform.value === "android" && !isStandalone.value) {
    showInstall.value = true;
  }
});
</script>

<style scoped>
.install-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: var(--bg-page);
  position: relative;
}

.install-page::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, var(--primary-soft) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, var(--primary-soft) 0%, transparent 50%);
  opacity: 0.5;
  pointer-events: none;
}

.install-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  padding: 40px 28px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 4px rgba(0, 0, 0, 0.04);
}

:root.dark .install-card {
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.3),
    0 1px 4px rgba(0, 0, 0, 0.2);
}

.install-logo {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

:root.dark .install-logo {
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.install-logo img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.install-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.install-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.6;
  max-width: 280px;
}

.install-action {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.install-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 36px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
  min-width: 210px;
  justify-content: center;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent);
}

.install-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--primary) 40%, transparent);
}

.install-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--primary) 30%, transparent);
}

.install-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.install-btn.secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: none;
}

.install-btn.secondary:hover:not(:disabled) {
  background: var(--bg-surface);
  border-color: var(--text-muted);
  box-shadow: none;
}

.install-meta {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin: 0;
  opacity: 0.8;
}

.install-fallback {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 4px;
}

.fallback-text {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.6;
}

.ios-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 280px;
}

.ios-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--bg-elevated);
  border-radius: 12px;
  font-size: 0.85rem;
  color: var(--text-primary);
  text-align: start;
  border: 1px solid var(--border-color);
}

.step-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.install-home-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-decoration: none;
  padding: 10px 18px;
  border-radius: 10px;
  transition: color 0.15s, background 0.15s;
  margin-top: 4px;
}

.install-home-link:hover {
  color: var(--primary);
  background: var(--primary-soft);
}

.spin {
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
