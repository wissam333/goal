<template>
  <div ref="container" class="ball-physics" @mousedown.prevent="startDrag" @touchstart.prevent="startDrag">
    <div
      ref="ball"
      class="ball"
      :style="{ transform: `translate(${x}px, ${y}px)` }"
    >
      <Icon name="game-icons:soccer-ball" />
    </div>
    <div class="ball-overlay">
      <div class="icon-wrap" :class="{ glow: overlapping }">
        <Icon ref="staticIcon" name="game-icons:soccer-ball" size="40" />
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
const GRAVITY = 0.15
const FRICTION = 0.98
const BOUNCE = 0.5
const BALL_SIZE = 48
const OVERLAP_DIST = BALL_SIZE * 1.2

const container = ref(null)
const ball = ref(null)
const staticIcon = ref(null)
const x = ref(0)
const y = ref(0)
const overlapping = ref(false)
let vx = 3
let vy = 0
let dragging = false
let dragX = 0
let dragY = 0
let lastX = 0
let lastY = 0
let rafId = null
let containerW = 0
let containerH = 0

function getSize() {
  if (!container.value) return
  containerW = container.value.clientWidth - BALL_SIZE
  containerH = container.value.clientHeight - BALL_SIZE
  x.value = Math.min(x.value, containerW)
  y.value = Math.min(y.value, containerH)
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

function checkOverlap() {
  const cx = x.value + BALL_SIZE / 2
  const cy = y.value + BALL_SIZE / 2
  const ix = (containerW + BALL_SIZE) / 2
  const iy = (containerH + BALL_SIZE) / 2
  const dx = cx - ix
  const dy = cy - iy
  overlapping.value = Math.sqrt(dx * dx + dy * dy) < OVERLAP_DIST
}

function physics() {
  if (dragging) { rafId = requestAnimationFrame(physics); return }
  vy += GRAVITY
  vx *= FRICTION
  vy *= FRICTION
  x.value += vx
  y.value += vy
  if (x.value < 0) { x.value = 0; vx *= -BOUNCE }
  if (x.value > containerW) { x.value = containerW; vx *= -BOUNCE }
  if (y.value < 0) { y.value = 0; vy *= -BOUNCE }
  if (y.value > containerH) { y.value = containerH; vy *= -BOUNCE }
  if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1 && y.value >= containerH) {
    vx = 0; vy = 0; overlapping.value = false; return
  }
  checkOverlap()
  rafId = requestAnimationFrame(physics)
}

function startDrag(e) {
  dragging = true
  const pt = e.touches ? e.touches[0] : e
  dragX = pt.clientX - x.value
  dragY = pt.clientY - y.value
  lastX = pt.clientX
  lastY = pt.clientY
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', endDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('touchend', endDrag)
}

function onDrag(e) {
  if (!dragging) return
  e.preventDefault()
  const pt = e.touches ? e.touches[0] : e
  x.value = clamp(pt.clientX - dragX, 0, containerW)
  y.value = clamp(pt.clientY - dragY, 0, containerH)
  vx = pt.clientX - lastX
  vy = pt.clientY - lastY
  lastX = pt.clientX
  lastY = pt.clientY
  checkOverlap()
}

function endDrag() {
  dragging = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', endDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', endDrag)
}

onMounted(() => {
  getSize()
  x.value = Math.random() * containerW
  y.value = Math.random() * (containerH * 0.5)
  rafId = requestAnimationFrame(physics)
  window.addEventListener('resize', getSize)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', getSize)
  endDrag()
})
</script>

<style scoped>
.ball-physics {
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #e8f5e9, #c8e6c9);
  border-radius: 20px;
  height: 200px;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  :root.dark & {
    background: linear-gradient(160deg, #0a1a0f, #0d1f14);
  }
}
.ball {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--primary);
  filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.2));
  pointer-events: none;
  will-change: transform;
  :root.dark & {
    filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5));
  }
}
.ball-overlay {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  pointer-events: none;
  color: var(--text-muted);
  :root.dark & {
    color: rgba(255, 255, 255, 0.3);
  }
  p {
    margin: 0;
    font-size: 0.9rem;
  }
}
.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  line-height: 1;
}
.glow {
  box-shadow: 0 0 6px 4px color-mix(in srgb, var(--primary) 50%, transparent), 0 0 14px 8px color-mix(in srgb, var(--primary) 20%, transparent);
}
</style>
