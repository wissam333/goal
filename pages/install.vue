<template>
  <div class="install-page" :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <div class="bg-glow" aria-hidden="true" />

    <div class="install-shell">
      <!-- Top bar -->
      <div class="top-bar">
        <NuxtLink to="/" class="back-link">
          <Icon
            :name="locale === 'ar' ? 'mdi:arrow-right' : 'mdi:arrow-left'"
            size="18"
          />
          {{ $t("install.backHome") }}
        </NuxtLink>
      </div>

      <div class="install-card">
        <div class="logo-wrap">
          <img src="/logo.png" alt="Green Ball" width="72" height="72" />
        </div>

        <h1 class="title">{{ appTitle || "Green Ball" }}</h1>
        <p class="desc">{{ $t("install.desc") }}</p>

        <!-- ── Already installed ─────────────────────────── -->
        <div v-if="isStandalone" class="panel success">
          <div class="panel-icon ok">
            <Icon name="mdi:check-circle" size="28" />
          </div>
          <p class="panel-title">{{ $t("install.alreadyInstalled") }}</p>
          <p class="panel-text">{{ $t("install.alreadyInstalledHint") }}</p>
          <NuxtLink to="/" class="btn primary">
            {{ $t("install.openApp") }}
          </NuxtLink>
        </div>

        <!-- ── In-app browser (FB / Messenger / WA / IG…) ── -->
        <div v-else-if="isInApp" class="panel warn">
          <div class="app-badge" v-if="inAppName">
            <Icon :name="inAppIcon" size="16" />
            {{ inAppName }}
          </div>

          <p class="panel-title">{{ $t("install.inappTitle") }}</p>
          <p class="panel-text">{{ $t("install.inappDesc") }}</p>

          <!-- Primary: escape to real browser -->
          <button type="button" class="btn primary" @click="handleOpenBrowser">
            <Icon name="mdi:open-in-new" size="20" />
            {{
              platform === "ios"
                ? $t("install.openSafari")
                : $t("install.openChrome")
            }}
          </button>

          <div class="btn-row">
            <button type="button" class="btn secondary" @click="handleCopy">
              <Icon
                :name="copied ? 'mdi:check' : 'mdi:content-copy'"
                size="18"
              />
              {{ copied ? $t("install.copied") : $t("install.copyLink") }}
            </button>
            <button
              v-if="canShare"
              type="button"
              class="btn secondary"
              @click="handleShare"
            >
              <Icon name="mdi:share-variant" size="18" />
              {{ $t("install.share") }}
            </button>
          </div>

          <!-- Step-by-step for this app -->
          <div class="steps">
            <p class="steps-title">{{ $t("install.manualSteps") }}</p>
            <div v-for="(step, i) in inAppSteps" :key="i" class="step">
              <span class="step-num">{{ i + 1 }}</span>
              <div class="step-body">
                <Icon :name="step.icon" size="18" />
                <span>{{ step.text }}</span>
              </div>
            </div>
          </div>

          <p class="hint-note">{{ $t("install.afterOpenHint") }}</p>
        </div>

        <!-- ── Android: native install prompt ready ─────── -->
        <div v-else-if="showInstall" class="panel">
          <button
            type="button"
            class="btn primary big"
            :disabled="installing"
            @click="handleInstall"
          >
            <Icon v-if="installing" name="mdi:loading" size="22" class="spin" />
            <template v-else>
              <Icon name="mdi:tray-arrow-down" size="22" />
              {{ $t("install.installBtn") }}
            </template>
          </button>
          <p class="meta">{{ $t("install.meta") }}</p>
        </div>

        <!-- ── iOS Safari: Add to Home Screen ───────────── -->
        <div v-else-if="platform === 'ios'" class="panel">
          <p class="panel-title">{{ $t("install.iosTitle") }}</p>
          <div class="steps">
            <div class="step">
              <span class="step-num">1</span>
              <div class="step-body">
                <Icon name="mdi:export-variant" size="18" />
                <span>{{ $t("install.iosStep1") }}</span>
              </div>
            </div>
            <div class="step">
              <span class="step-num">2</span>
              <div class="step-body">
                <Icon name="mdi:plus-box-outline" size="18" />
                <span>{{ $t("install.iosStep2") }}</span>
              </div>
            </div>
            <div class="step">
              <span class="step-num">3</span>
              <div class="step-body">
                <Icon name="mdi:check-bold" size="18" />
                <span>{{ $t("install.iosStep3") }}</span>
              </div>
            </div>
          </div>
          <div class="btn-row">
            <button type="button" class="btn secondary" @click="handleCopy">
              <Icon
                :name="copied ? 'mdi:check' : 'mdi:content-copy'"
                size="18"
              />
              {{ copied ? $t("install.copied") : $t("install.copyLink") }}
            </button>
          </div>
        </div>

        <!-- ── Android without prompt yet ───────────────── -->
        <div v-else-if="platform === 'android'" class="panel">
          <p class="panel-title">{{ $t("install.androidManualTitle") }}</p>
          <div class="steps">
            <div class="step">
              <span class="step-num">1</span>
              <div class="step-body">
                <Icon name="mdi:dots-vertical" size="18" />
                <span>{{ $t("install.androidStep1") }}</span>
              </div>
            </div>
            <div class="step">
              <span class="step-num">2</span>
              <div class="step-body">
                <Icon name="mdi:plus-box-outline" size="18" />
                <span>{{ $t("install.androidStep2") }}</span>
              </div>
            </div>
            <div class="step">
              <span class="step-num">3</span>
              <div class="step-body">
                <Icon name="mdi:check-bold" size="18" />
                <span>{{ $t("install.androidStep3") }}</span>
              </div>
            </div>
          </div>
          <button
            v-if="isInstallable"
            type="button"
            class="btn primary"
            :disabled="installing"
            @click="handleInstall"
          >
            <Icon v-if="installing" name="mdi:loading" size="20" class="spin" />
            <template v-else>
              <Icon name="mdi:tray-arrow-down" size="20" />
              {{ $t("install.installBtn") }}
            </template>
          </button>
        </div>

        <!-- ── Desktop ─────────────────────────────────── -->
        <div v-else class="panel">
          <p class="panel-title">{{ $t("install.desktopTitle") }}</p>
          <p class="panel-text">{{ $t("install.desktopDesc") }}</p>
          <div class="steps">
            <div class="step">
              <span class="step-num">1</span>
              <div class="step-body">
                <Icon name="mdi:laptop" size="18" />
                <span>{{ $t("install.desktopStep1") }}</span>
              </div>
            </div>
            <div class="step">
              <span class="step-num">2</span>
              <div class="step-body">
                <Icon name="mdi:plus" size="18" />
                <span>{{ $t("install.desktopStep2") }}</span>
              </div>
            </div>
          </div>
          <button
            v-if="isInstallable"
            type="button"
            class="btn primary"
            :disabled="installing"
            @click="handleInstall"
          >
            <Icon v-if="installing" name="mdi:loading" size="20" class="spin" />
            <template v-else>
              <Icon name="mdi:tray-arrow-down" size="20" />
              {{ $t("install.installBtn") }}
            </template>
          </button>
          <div class="btn-row">
            <button type="button" class="btn secondary" @click="handleCopy">
              <Icon
                :name="copied ? 'mdi:check' : 'mdi:content-copy'"
                size="18"
              />
              {{ copied ? $t("install.copied") : $t("install.copyLink") }}
            </button>
          </div>
        </div>

        <!-- Link preview -->
        <div v-if="!isStandalone" class="link-box" @click="handleCopy">
          <Icon name="mdi:link-variant" size="16" />
          <span class="link-text">{{ displayUrl }}</span>
          <Icon
            :name="copied ? 'mdi:check' : 'mdi:content-copy'"
            size="16"
            class="link-copy"
          />
        </div>
      </div>

      <p class="footer-note">{{ $t("install.footerNote") }}</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false });

const { locale, t } = useI18n();
const { name: appTitle } = useAppTitle();
const config = useRuntimeConfig();
const { isInstallable, install } = usePwaInstall();
const {
  detectApp,
  isInAppBrowser,
  detectPlatform,
  isStandaloneMode,
  getCurrentUrl,
  openInExternalBrowser,
  copyLink,
  shareLink,
  canShare: canShareFn,
} = useInAppBrowser();

const installing = ref(false);
const platform = ref("desktop");
const isInApp = ref(false);
const inAppKey = ref(null);
const showInstall = ref(false);
const isStandalone = ref(false);
const copied = ref(false);
const canShare = ref(false);
const pageUrl = ref("");

const siteUrl = computed(() => {
  const cfg = (config.public.siteUrl || "").replace(/\/$/, "");
  if (import.meta.client && pageUrl.value) return pageUrl.value;
  return cfg || "https://goal.wissam-n-najjom.workers.dev";
});

const displayUrl = computed(() => {
  try {
    return (
      new URL(siteUrl.value).host +
      new URL(siteUrl.value).pathname.replace(/\/$/, "")
    );
  } catch {
    return siteUrl.value;
  }
});

const installTargetUrl = computed(() => {
  // Prefer live page URL so league deep-links work; fall back to site root /install
  if (import.meta.client && pageUrl.value) return pageUrl.value;
  const base = (config.public.siteUrl || "").replace(/\/$/, "");
  return `${base}/install`;
});

const appMeta = {
  facebook: { icon: "mdi:facebook", nameKey: "install.appFacebook" },
  messenger: {
    icon: "mdi:facebook-messenger",
    nameKey: "install.appMessenger",
  },
  instagram: { icon: "mdi:instagram", nameKey: "install.appInstagram" },
  whatsapp: { icon: "mdi:whatsapp", nameKey: "install.appWhatsapp" },
  telegram: { icon: "mdi:telegram", nameKey: "install.appTelegram" },
  line: { icon: "mdi:chat", nameKey: "install.appLine" },
  wechat: { icon: "mdi:wechat", nameKey: "install.appWechat" },
  tiktok: { icon: "mdi:music-note", nameKey: "install.appTiktok" },
  snapchat: { icon: "mdi:snapchat", nameKey: "install.appSnapchat" },
  webview: { icon: "mdi:cellphone", nameKey: "install.appWebview" },
};

const inAppName = computed(() => {
  const m = appMeta[inAppKey.value];
  return m ? t(m.nameKey) : "";
});

const inAppIcon = computed(
  () => appMeta[inAppKey.value]?.icon || "mdi:cellphone",
);

const inAppSteps = computed(() => {
  const ios = platform.value === "ios";
  const app = inAppKey.value;

  // iOS: menu → Open in Safari → Share → Add to Home
  if (ios) {
    const openLabel =
      app === "whatsapp" || app === "telegram"
        ? t("install.stepIosOpenSafariMenu")
        : t("install.stepIosOpenSafariDots");
    return [
      { icon: "mdi:dots-horizontal", text: openLabel },
      { icon: "mdi:apple-safari", text: t("install.stepIosSafari") },
      { icon: "mdi:export-variant", text: t("install.stepIosShare") },
      { icon: "mdi:plus-box-outline", text: t("install.stepIosAdd") },
    ];
  }

  // Android in-app
  if (app === "whatsapp") {
    return [
      { icon: "mdi:dots-vertical", text: t("install.stepWaMenu") },
      { icon: "mdi:open-in-new", text: t("install.stepWaOpen") },
      { icon: "mdi:google-chrome", text: t("install.stepThenInstall") },
    ];
  }
  if (app === "facebook" || app === "messenger" || app === "instagram") {
    return [
      { icon: "mdi:dots-horizontal", text: t("install.stepFbMenu") },
      { icon: "mdi:google-chrome", text: t("install.stepFbChrome") },
      { icon: "mdi:tray-arrow-down", text: t("install.stepThenInstall") },
    ];
  }
  return [
    { icon: "mdi:open-in-new", text: t("install.stepGenericOpen") },
    { icon: "mdi:google-chrome", text: t("install.stepGenericBrowser") },
    { icon: "mdi:tray-arrow-down", text: t("install.stepThenInstall") },
  ];
});

const handleInstall = async () => {
  installing.value = true;
  try {
    const accepted = await install();
    if (accepted) {
      showInstall.value = false;
      isStandalone.value = isStandaloneMode();
    }
  } finally {
    installing.value = false;
  }
};

const handleOpenBrowser = () => {
  openInExternalBrowser(installTargetUrl.value);
};

const handleCopy = async () => {
  const ok = await copyLink(installTargetUrl.value);
  if (ok) {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2200);
  }
};

const handleShare = async () => {
  await shareLink(installTargetUrl.value, appTitle.value || "Green Ball");
};

onMounted(() => {
  pageUrl.value = getCurrentUrl() || `${window.location.origin}/install`;
  canShare.value = canShareFn();
  isStandalone.value = isStandaloneMode();
  if (isStandalone.value) return;

  platform.value = detectPlatform();
  const app = detectApp();
  if (app || isInAppBrowser()) {
    isInApp.value = true;
    inAppKey.value = app || "webview";
    return;
  }

  // Real browser: show install when available
  if (platform.value === "android" && isInstallable.value) {
    showInstall.value = true;
  }
});

watch(isInstallable, (val) => {
  if (val && !isInApp.value && !isStandalone.value) {
    if (platform.value === "android" || platform.value === "desktop") {
      showInstall.value = true;
    }
  }
});

useSeoMeta({
  title: () => t("install.seoTitle"),
  description: () => t("install.desc"),
  ogTitle: () => t("install.seoTitle"),
  ogDescription: () => t("install.desc"),
  ogImage: "/logo.png",
});
</script>

<style scoped>
.install-page {
  min-height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 16px 16px 40px;
  background: var(--bg-page);
  position: relative;
  overflow-x: hidden;
}

.bg-glow {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      ellipse 70% 50% at 50% -10%,
      color-mix(in srgb, var(--primary) 22%, transparent),
      transparent 60%
    ),
    radial-gradient(
      ellipse 50% 40% at 100% 80%,
      color-mix(in srgb, var(--primary) 10%, transparent),
      transparent 55%
    );
}

.install-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
}

.top-bar {
  margin-bottom: 12px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  padding: 8px 4px;
}
.back-link:hover {
  color: var(--primary);
}

.install-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 28px 22px 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  text-align: center;
}
:root.dark .install-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.logo-wrap {
  width: 84px;
  height: 84px;
  border-radius: 22px;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 6px 20px color-mix(in srgb, var(--primary) 18%, transparent);
}
.logo-wrap img {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.desc {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--text-muted);
  max-width: 320px;
}

.panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}
.panel.warn {
  padding: 4px 0 0;
}
.panel.success .panel-icon.ok {
  color: var(--primary);
}

.panel-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--text-primary);
}
.panel-text {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.55;
  color: var(--text-muted);
}

.app-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #e11d48;
  background: rgba(225, 29, 72, 0.1);
  border: 1px solid rgba(225, 29, 72, 0.2);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 20px;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition:
    transform 0.12s,
    opacity 0.15s,
    background 0.15s;
}
.btn:active:not(:disabled) {
  transform: scale(0.98);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn.primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 35%, transparent);
}
.btn.primary:hover:not(:disabled) {
  opacity: 0.94;
}
.btn.primary.big {
  padding: 16px 24px;
  font-size: 1.05rem;
}
.btn.secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: none;
}
.btn.secondary:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}
.btn-row .btn {
  width: 100%;
  padding: 12px 10px;
  font-size: 0.85rem;
}
.btn-row:has(> :only-child) {
  grid-template-columns: 1fr;
}

.meta {
  margin: 0;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.steps {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: start;
}
.steps-title {
  margin: 4px 0 2px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}
.step-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.step-body {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.35;
}
.step-body .iconify {
  color: var(--primary);
  flex-shrink: 0;
}

.hint-note {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--text-muted);
  padding: 10px 12px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
}

.link-box {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  margin-top: 4px;
  border-radius: 12px;
  background: var(--bg-elevated);
  border: 1px dashed var(--border-color);
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.78rem;
}
.link-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: start;
  direction: ltr;
}
.link-copy {
  color: var(--primary);
  flex-shrink: 0;
}

.footer-note {
  margin: 16px 8px 0;
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.45;
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
