<template>
  <div
    ref="container"
    class="ball-physics"
    :class="{ grabbing: dragging }"
    @pointerdown="onPointerDown"
  >
    <!-- Pitch markings -->
    <div class="pitch" aria-hidden="true">
      <div class="pitch-center" />
      <div class="pitch-spot" />
      <div class="pitch-line top" />
      <div class="pitch-line bottom" />
    </div>

    <div
      ref="ballEl"
      class="ball"
      :class="{ active: dragging }"
    >
      <Icon name="game-icons:soccer-ball" />
    </div>

    <div v-if="$slots.default" class="ball-overlay">
      <slot />
    </div>

    <div v-if="kicks > 0" class="kick-badge" aria-live="polite">
      <Icon name="mdi:soccer" size="12" />
      {{ kicks }}
    </div>
  </div>
</template>

<script setup>
/**
 * Smooth ball physics mini-game.
 * Uses pointer capture + direct DOM transforms so drag stays lag-free
 * even when the cursor leaves the box.
 */
const GRAVITY = 0.28
const FRICTION = 0.992
const BOUNCE = 0.62
const BALL_SIZE = 48
const MAX_V = 28
const REST_EPS = 0.08

const container = ref(null)
const ballEl = ref(null)
const kicks = ref(0)
const dragging = ref(false)

// Non-reactive physics state (avoids Vue re-renders every frame)
let x = 0
let y = 0
let vx = 2.4
let vy = 0
let containerW = 0
let containerH = 0
let rafId = 0
let pointerId = null
let dragOffsetX = 0
let dragOffsetY = 0
let lastMoveT = 0
let lastMoveX = 0
let lastMoveY = 0
// Short velocity sample buffer for throw feel
const samples = []
const SAMPLE_MS = 90

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

function applyTransform() {
  if (!ballEl.value) return
  // translate3d keeps the layer on the GPU
  ballEl.value.style.transform = `translate3d(${x}px, ${y}px, 0)`
}

function measure() {
  if (!container.value) return
  containerW = Math.max(0, container.value.clientWidth - BALL_SIZE)
  containerH = Math.max(0, container.value.clientHeight - BALL_SIZE)
  x = clamp(x, 0, containerW)
  y = clamp(y, 0, containerH)
  applyTransform()
}

function physics() {
  if (dragging.value) {
    rafId = 0
    return
  }

  vy += GRAVITY
  vx *= FRICTION
  vy *= FRICTION

  // Soft air drag when moving fast
  if (Math.abs(vx) > 12) vx *= 0.99
  if (Math.abs(vy) > 12) vy *= 0.99

  x += vx
  y += vy

  if (x < 0) {
    x = 0
    vx = Math.abs(vx) * BOUNCE
  } else if (x > containerW) {
    x = containerW
    vx = -Math.abs(vx) * BOUNCE
  }
  if (y < 0) {
    y = 0
    vy = Math.abs(vy) * BOUNCE
  } else if (y > containerH) {
    y = containerH
    vy = -Math.abs(vy) * BOUNCE
    // Ground friction
    vx *= 0.9
  }

  applyTransform()

  const resting =
    Math.abs(vx) < REST_EPS &&
    Math.abs(vy) < REST_EPS &&
    y >= containerH - 0.5

  if (resting) {
    vx = 0
    vy = 0
    y = containerH
    applyTransform()
    rafId = 0
    return
  }

  rafId = requestAnimationFrame(physics)
}

function ensureLoop() {
  if (!rafId && !dragging.value) rafId = requestAnimationFrame(physics)
}

function stopLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

function onPointerDown(e) {
  if (!container.value || !ballEl.value) return
  // Only primary button / touch
  if (e.pointerType === 'mouse' && e.button !== 0) return

  const rect = container.value.getBoundingClientRect()
  const localX = e.clientX - rect.left
  const localY = e.clientY - rect.top

  // Grab if pointer is near the ball (generous hit area)
  const cx = x + BALL_SIZE / 2
  const cy = y + BALL_SIZE / 2
  const dist = Math.hypot(localX - cx, localY - cy)
  if (dist > BALL_SIZE * 0.95) {
    // Tap empty pitch → gentle nudge toward pointer
    const dx = localX - cx
    const dy = localY - cy
    const len = Math.hypot(dx, dy) || 1
    vx = (dx / len) * 6
    vy = (dy / len) * 4 - 2
    kicks.value++
    ensureLoop()
    return
  }

  stopLoop()
  dragging.value = true
  dragOffsetX = localX - x
  dragOffsetY = localY - y
  lastMoveT = performance.now()
  lastMoveX = e.clientX
  lastMoveY = e.clientY
  samples.length = 0
  vx = 0
  vy = 0

  pointerId = e.pointerId
  try {
    container.value.setPointerCapture(e.pointerId)
  } catch {
    /* older browsers */
  }

  // Listen on window so move/up still work if capture fails
  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)

  e.preventDefault()
}

function onPointerMove(e) {
  if (!dragging.value || (pointerId != null && e.pointerId !== pointerId) || !container.value) return

  // Stop page scroll while dragging on touch devices
  if (e.cancelable) e.preventDefault()

  const rect = container.value.getBoundingClientRect()
  const localX = e.clientX - rect.left
  const localY = e.clientY - rect.top

  x = clamp(localX - dragOffsetX, 0, containerW)
  y = clamp(localY - dragOffsetY, 0, containerH)
  applyTransform()

  const now = performance.now()
  const dt = Math.max(1, now - lastMoveT)
  samples.push({
    t: now,
    vx: ((e.clientX - lastMoveX) / dt) * 16.67,
    vy: ((e.clientY - lastMoveY) / dt) * 16.67,
  })
  // Keep only recent samples
  while (samples.length && now - samples[0].t > SAMPLE_MS) samples.shift()

  lastMoveT = now
  lastMoveX = e.clientX
  lastMoveY = e.clientY
}

function onPointerUp(e) {
  if (pointerId != null && e?.pointerId != null && e.pointerId !== pointerId) return
  if (!dragging.value) return

  // Average recent velocity for a natural throw
  if (samples.length) {
    let svx = 0
    let svy = 0
    for (const s of samples) {
      svx += s.vx
      svy += s.vy
    }
    vx = clamp(svx / samples.length, -MAX_V, MAX_V)
    vy = clamp(svy / samples.length, -MAX_V, MAX_V)
  } else {
    vx = 0
    vy = 0
  }

  // Count a kick if thrown with some force
  if (Math.hypot(vx, vy) > 1.2) kicks.value++

  const capturedId = pointerId
  dragging.value = false
  pointerId = null
  samples.length = 0
  cleanupListeners(capturedId)
  ensureLoop()
}

function cleanupListeners(capturedId = null) {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  const id = capturedId ?? pointerId
  if (id != null && container.value) {
    try {
      container.value.releasePointerCapture(id)
    } catch {
      /* already released */
    }
  }
}

onMounted(() => {
  measure()
  x = Math.random() * Math.max(1, containerW)
  y = Math.random() * Math.max(1, containerH * 0.35)
  applyTransform()
  ensureLoop()
  window.addEventListener('resize', measure, { passive: true })
})

onUnmounted(() => {
  stopLoop()
  window.removeEventListener('resize', measure)
  cleanupListeners()
  dragging.value = false
  pointerId = null
})
</script>

<style scoped>
.ball-physics {
  position: relative;
  overflow: hidden;
  height: 220px;
  border-radius: 20px;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  background:
    radial-gradient(ellipse 80% 60% at 50% 100%, rgba(34, 197, 94, 0.12), transparent 60%),
    linear-gradient(160deg, #e8f5e9, #c8e6c9 55%, #dcedc8);
  border: 1px solid color-mix(in srgb, var(--primary) 18%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);

  &.grabbing {
    cursor: grabbing;
  }

  :root.dark & {
    background:
      radial-gradient(ellipse 80% 60% at 50% 100%, rgba(34, 197, 94, 0.1), transparent 60%),
      linear-gradient(160deg, #0a1a0f, #0d1f14 55%, #0a1610);
    border-color: rgba(34, 197, 94, 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
}

.pitch {
  position: absolute;
  inset: 12px;
  border: 1.5px solid color-mix(in srgb, var(--primary) 22%, transparent);
  border-radius: 12px;
  pointer-events: none;
  opacity: 0.7;
  :root.dark & {
    border-color: rgba(255, 255, 255, 0.08);
    opacity: 0.5;
  }
}

.pitch-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 56px;
  height: 56px;
  border: 1.5px solid color-mix(in srgb, var(--primary) 28%, transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  :root.dark & {
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.pitch-spot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary) 40%, transparent);
  transform: translate(-50%, -50%);
  :root.dark & {
    background: rgba(255, 255, 255, 0.15);
  }
}

.pitch-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  border-top: 1.5px solid color-mix(in srgb, var(--primary) 22%, transparent);
  &.top {
    top: 22%;
  }
  &.bottom {
    bottom: 22%;
  }
  :root.dark & {
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.ball {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--primary);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.22));
  pointer-events: none;
  will-change: transform;
  transition: filter 0.15s ease;

  &.active {
    filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.3));
  }

  :root.dark & {
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.55));
    &.active {
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.7));
    }
  }
}

.ball-overlay {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  padding: 16px;
  pointer-events: none;
  color: var(--text-muted);
  text-align: center;

  :root.dark & {
    color: rgba(255, 255, 255, 0.45);
  }

  :deep(p) {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
  }

  :deep(.empty-hint) {
    font-size: 0.75rem;
    font-weight: 500;
    opacity: 0.85;
  }

  :deep(.empty-icon) {
    font-size: 1.4rem;
    opacity: 0.7;
    margin-bottom: 2px;
  }
}

.kick-badge {
  position: absolute;
  top: 10px;
  inset-inline-end: 10px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, var(--bg-surface, #fff));
  border: 1px solid color-mix(in srgb, var(--primary) 22%, transparent);
  pointer-events: none;
  backdrop-filter: blur(6px);
}
</style>
