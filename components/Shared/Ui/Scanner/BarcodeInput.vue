<!-- components/Shared/Ui/Scanner/BarcodeInput.vue -->
<!-- Usage: <SharedUiScannerBarcodeInput v-model="form.barcode" @scan="onScan" /> -->
<!--
  Platform routing (automatic, zero config):
  ┌─────────────────┬──────────────────────────────────────────────────┐
  │ Electron        │ USB/serial HW scanner — global keydown listener  │
  │ Capacitor iOS   │ Google MLKit native — GPU-accelerated            │
  │ Capacitor Droid │ Google MLKit native — GPU-accelerated            │
  │ Browser/Electron│ ZXing bundled + ROI crop + contrast pipeline     │
  └─────────────────┴──────────────────────────────────────────────────┘

  Deps:  npm install @zxing/library          (already at 0.23.0)
         npm install @capacitor-mlkit/barcode-scanning  (mobile only)
-->
<template>
  <div class="barcode-input-wrap">
    <!-- ── Input row ─────────────────────────────────────────────────────── -->
    <div
      class="barcode-field"
      :class="{
        'is-hw': hwActive,
        'is-camera': cameraOpen,
        'is-error': !!scanError,
      }"
    >
      <!-- Barcode icon -->
      <div class="barcode-icon">
        <Icon name="mdi:barcode-scan" size="18" />
      </div>

      <!-- Text input -->
      <input
        ref="inputRef"
        v-model="localValue"
        class="barcode-input"
        :placeholder="placeholder || $t('barcode')"
        :disabled="disabled"
        autocomplete="off"
        spellcheck="false"
        @keydown.enter.prevent="onManualEnter"
        @input="emit('update:modelValue', localValue)"
      />

      <!-- HW scanner badge (Electron only) -->
      <span v-if="isElectronEnv" class="hw-badge" :class="{ active: hwActive }">
        <Icon name="mdi:usb" size="13" />
        {{
          hwActive
            ? $t("scannerReady") || "Scanner Ready"
            : $t("scannerOff") || "No Scanner"
        }}
      </span>

      <!-- Camera button (non-Electron) -->
      <button
        v-else
        class="barcode-scan-btn"
        :class="{ active: cameraOpen, loading: scanLoading }"
        :disabled="scanLoading"
        :title="
          cameraOpen
            ? $t('closeCamera') || 'Close camera'
            : $t('scanBarcode') || 'Scan barcode'
        "
        @click="toggleCamera"
      >
        <Icon
          :name="
            scanLoading
              ? 'mdi:loading'
              : cameraOpen
              ? 'mdi:close'
              : 'mdi:camera'
          "
          size="18"
          :class="{ spin: scanLoading }"
        />
      </button>
    </div>

    <!-- ── Camera panel ───────────────────────────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="cameraOpen" class="camera-panel">
        <div class="camera-viewport">
          <!-- Live video feed — used by JS decoder, hidden for Capacitor native -->
          <video
            ref="videoEl"
            class="camera-video"
            :class="{ hidden: isCapacitorEnv }"
            autoplay
            playsinline
            muted
          />

          <!-- Capacitor native placeholder -->
          <div v-if="isCapacitorEnv" class="capacitor-hint">
            <Icon name="mdi:camera-outline" size="32" />
            <span>{{
              $t("nativeScannerActive") || "Native scanner active"
            }}</span>
          </div>

          <!-- Scan frame overlay (JS decoder only) -->
          <div v-if="!isCapacitorEnv" class="scan-overlay">
            <div class="scan-frame">
              <span class="sf-corner sf-tl" />
              <span class="sf-corner sf-tr" />
              <span class="sf-corner sf-bl" />
              <span class="sf-corner sf-br" />
              <div class="scan-line" />
            </div>
            <!-- ROI label -->
            <div class="roi-hint">
              {{ $t("centerBarcode") || "Center barcode in frame" }}
            </div>
          </div>

          <!-- Warmup overlay -->
          <Transition name="fade">
            <div v-if="cameraWarmup" class="camera-warmup">
              <div class="warmup-spinner" />
              <span>{{ $t("startingCamera") || "Starting camera…" }}</span>
            </div>
          </Transition>

          <!-- Last detected format badge -->
          <Transition name="fade">
            <div v-if="detectedFormat" class="format-badge">
              <Icon name="mdi:check-circle" size="12" />
              {{ detectedFormat }}
            </div>
          </Transition>
        </div>

        <!-- Error -->
        <p v-if="scanError" class="camera-error">
          <Icon name="mdi:alert-circle-outline" size="14" />
          {{ scanError }}
        </p>

        <!-- Close button -->
        <button class="camera-close" @click="closeCamera">
          <Icon name="mdi:close-circle" size="16" />
          {{ $t("cancel") || "Cancel" }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useBarcodeScanner } from "~/composables/useBarcodeScanner";

// ── Props & emits ──────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  /**
   * directMode: if true, don't update v-model on scan —
   * only emit the "scan" event (useful in rapid-fire scanning flows)
   */
  directMode: { type: Boolean, default: false },
  /**
   * autoReopen: after a successful camera scan, reopen camera automatically
   * (useful for bulk scanning sessions)
   */
  autoReopen: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "scan"]);

// ── Platform flags ─────────────────────────────────────────────────────────────
const isElectronEnv = typeof window !== "undefined" && !!window.electronAPI;
const isCapacitorEnv =
  typeof window !== "undefined" &&
  !!(
    window.Capacitor &&
    window.Capacitor.isNativePlatform &&
    window.Capacitor.isNativePlatform()
  );

// ── Composable ─────────────────────────────────────────────────────────────────
const {
  startHwListener,
  scanWithCamera,
  error: scannerError,
} = useBarcodeScanner();

// ── Local state ────────────────────────────────────────────────────────────────
const localValue = ref(props.modelValue);
const cameraOpen = ref(false);
const cameraWarmup = ref(false);
const scanLoading = ref(false);
const scanError = ref("");
const hwActive = ref(false);
const detectedFormat = ref("");

const inputRef = ref(null);
const videoEl = ref(null);

let _stopCamera = null; // stop fn returned by scanWithCamera
let _stopHw = null; // stop fn returned by startHwListener
let _formatTimer = null; // auto-clear detectedFormat badge
let _reopenTimer = null; // autoReopen delay

// ── Sync prop → local ──────────────────────────────────────────────────────────
watch(
  () => props.modelValue,
  (v) => {
    localValue.value = v;
  },
);

// ── Scan result handler (all sources) ─────────────────────────────────────────
function handleScan(result) {
  const clean = (result.code || "").trim();
  if (!clean) return;

  // Update v-model unless directMode
  if (!props.directMode) {
    localValue.value = clean;
    emit("update:modelValue", clean);
  }

  // Show format badge
  detectedFormat.value = result.format || "";
  clearTimeout(_formatTimer);
  _formatTimer = setTimeout(() => {
    detectedFormat.value = "";
  }, 2500);

  // Beep on camera scans (mobile only, no sound on desktop/Electron)
  if (result.source === "camera-js" || result.source === "camera-native") {
    _beep();

    if (props.autoReopen) {
      closeCamera();
      clearTimeout(_reopenTimer);
      _reopenTimer = setTimeout(() => openCamera(), 1200);
    } else {
      closeCamera();
    }
  }

  emit("scan", clean);
}

// ── Manual enter key ──────────────────────────────────────────────────────────
function onManualEnter() {
  const clean = localValue.value.trim();
  if (clean) emit("scan", clean);
}

// ── Camera ─────────────────────────────────────────────────────────────────────
async function openCamera() {
  scanError.value = "";
  scanLoading.value = true;
  cameraWarmup.value = true;
  cameraOpen.value = true;

  try {
    // Pass the <video> ref so the JS decoder renders into it
    // (Capacitor ignores this — it renders natively below the WebView)
    _stopCamera = await scanWithCamera(handleScan, videoEl.value);
    cameraWarmup.value = false;
  } catch (e) {
    cameraWarmup.value = false;
    cameraOpen.value = false;
    scanError.value = e && e.message ? e.message : "Camera error";
    console.error("[BarcodeInput] openCamera error", e);
  } finally {
    scanLoading.value = false;
  }
}

function closeCamera() {
  if (_stopCamera) {
    _stopCamera();
    _stopCamera = null;
  }
  cameraOpen.value = false;
  cameraWarmup.value = false;
  scanLoading.value = false;
  scanError.value = "";
}

function toggleCamera() {
  if (cameraOpen.value) closeCamera();
  else openCamera();
}

// ── Web Audio beep (mobile camera scans only) ─────────────────────────────────
function _beep() {
  if (isElectronEnv) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => ctx.close();
  } catch (_) {
    /* ignore if AudioContext unavailable */
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(() => {
  if (isElectronEnv) {
    hwActive.value = true;
    _stopHw = startHwListener(handleScan);
  }
});

onUnmounted(() => {
  closeCamera();
  if (_stopHw) {
    _stopHw();
    _stopHw = null;
  }
  clearTimeout(_formatTimer);
  clearTimeout(_reopenTimer);
});
</script>

<style scoped>
/* ── Wrapper ── */
.barcode-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Input row ── */
.barcode-field {
  display: flex;
  align-items: center;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.barcode-field:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.barcode-field.is-hw {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}
.barcode-field.is-camera {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.barcode-field.is-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* ── Barcode icon ── */
.barcode-icon {
  padding: 0 10px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* ── Text input ── */
.barcode-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 10px 6px;
  font-size: 0.9rem;
  font-family: "Courier New", Courier, monospace;
  letter-spacing: 0.06em;
  color: var(--text-primary);
  min-width: 0; /* flex shrink fix */
}
.barcode-input::placeholder {
  color: var(--text-muted);
  font-family: "Tajawal", sans-serif;
  letter-spacing: 0;
  font-size: 0.85rem;
}
.barcode-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Camera button ── */
.barcode-scan-btn {
  background: none;
  border: none;
  border-inline-start: 1.5px solid var(--border-color);
  padding: 0 13px;
  height: 42px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.barcode-scan-btn:hover {
  background: var(--primary-soft);
  color: var(--primary);
}
.barcode-scan-btn.active {
  background: var(--primary-soft);
  color: var(--primary);
}
.barcode-scan-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Spin animation ── */
.spin {
  animation: spin 0.75s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── HW scanner badge ── */
.hw-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 3px 10px;
  margin-inline-end: 8px;
  border-radius: 20px;
  white-space: nowrap;
  background: rgba(100, 116, 139, 0.1);
  color: var(--text-muted);
  transition: background 0.2s, color 0.2s;
}
.hw-badge.active {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

/* ── Camera panel ── */
.camera-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Viewport ── */
.camera-viewport {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #0a0a0a;
  aspect-ratio: 4 / 3;
  max-height: 320px;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.camera-video.hidden {
  display: none;
}

/* ── Capacitor placeholder ── */
.capacitor-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.82rem;
}

/* ── Scan overlay ── */
.scan-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.scan-frame {
  position: relative;
  width: 64%;
  aspect-ratio: 1.4 / 1; /* wider than tall — better for 1D barcodes */
}

/* Dim area outside scan frame */
.scan-frame::before {
  content: "";
  position: absolute;
  inset: -9999px;
  box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.45);
  border-radius: 10px;
  pointer-events: none;
}

/* Corner brackets */
.sf-corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border-color: var(--primary, #ea1c24);
  border-style: solid;
}
.sf-tl {
  inset-block-start: 0;
  inset-inline-start: 0;
  border-width: 3px 0 0 3px;
  border-start-start-radius: 4px;
}
.sf-tr {
  inset-block-start: 0;
  inset-inline-end: 0;
  border-width: 3px 3px 0 0;
  border-start-end-radius: 4px;
}
.sf-bl {
  inset-block-end: 0;
  inset-inline-start: 0;
  border-width: 0 0 3px 3px;
  border-end-start-radius: 4px;
}
.sf-br {
  inset-block-end: 0;
  inset-inline-end: 0;
  border-width: 0 3px 3px 0;
  border-end-end-radius: 4px;
}

/* Scanning line */
.scan-line {
  position: absolute;
  inset-inline: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--primary, #ea1c24) 50%,
    transparent
  );
  animation: scanline 1.8s ease-in-out infinite;
  box-shadow: 0 0 6px var(--primary, #ea1c24);
}
@keyframes scanline {
  0%,
  100% {
    top: 4%;
  }
  50% {
    top: 92%;
  }
}

/* ROI hint label */
.roi-hint {
  position: absolute;
  bottom: -24px;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
  letter-spacing: 0.03em;
}

/* ── Warmup overlay ── */
.camera-warmup {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.82rem;
  backdrop-filter: blur(4px);
}
.warmup-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

/* ── Format badge ── */
.format-badge {
  position: absolute;
  inset-block-end: 10px;
  inset-inline-end: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(16, 185, 129, 0.88);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
  pointer-events: none;
  letter-spacing: 0.03em;
}

/* ── Error ── */
.camera-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0;
}

/* ── Close button ── */
.camera-close {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border-color);
  border-radius: 8px;
  padding: 9px;
  font-size: 0.82rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.camera-close:hover {
  color: var(--text-primary);
  border-color: var(--text-muted);
}

/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.slide-down-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
