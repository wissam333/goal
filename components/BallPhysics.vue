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

    <!-- Goal frame -->
    <div class="goal" :class="{ 'goal-flash': goalFlash }" aria-hidden="true">
      <div class="goal-post goal-post-top" />
      <div class="goal-post goal-post-bottom" />
      <div class="goal-net" />
    </div>

    <div ref="ballEl" class="ball" :class="{ active: dragging }">
      <Icon name="game-icons:soccer-ball" />
    </div>

    <!-- Goal celebration confetti -->
    <div v-if="celebrating" class="goal-confetti" aria-hidden="true">
      <div
        v-for="i in 16"
        :key="i"
        class="confetti-piece"
        :style="confettiStyle(i)"
      />
    </div>

    <div v-if="celebrating" class="goal-banner">GOAL!</div>

    <div v-if="$slots.default" class="ball-overlay">
      <slot />
    </div>

    <div v-if="score > 0" class="score-badges" aria-live="polite">
      <div class="score-badge goal-score">
        <Icon name="mdi:soccer-field" size="12" />
        {{ score }}
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Smooth ball physics mini-game.
 * Uses pointer capture + direct DOM transforms so drag stays lag-free
 * even when the cursor leaves the box.
 */
const GRAVITY = 0.28;
const FRICTION = 0.992;
const BOUNCE = 0.62;
const BALL_SIZE_DESKTOP = 48;
const BALL_SIZE_MOBILE = 32;
const MAX_V = 28;
const REST_EPS = 0.08;
const MOBILE_BREAKPOINT = 480;

// Mobile touch tuning
const TOUCH_GRAB_MULT = 1.6; // generous grab radius on touch vs mouse

// Goal geometry (relative to container, tuned in onMounted/measure)
const GOAL_HEIGHT_RATIO_DESKTOP = 0.5; // goal opening height as % of container height
const GOAL_HEIGHT_RATIO_MOBILE = 0.4; // smaller opening on phones, matches shrunk goal art

const container = ref(null);
const ballEl = ref(null);
const kicks = ref(0);
const score = ref(0);
const dragging = ref(false);
const goalFlash = ref(false);
const celebrating = ref(false);

let goalFlashTimeout = null;
let celebrateTimeout = null;
let goalCooldown = false;

// Non-reactive physics state (avoids Vue re-renders every frame)
let x = 0;
let y = 0;
let vx = 2.4;
let vy = 0;
let containerW = 0;
let containerH = 0;
let rafId = 0;
let pointerId = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastMoveT = 0;
let lastMoveX = 0;
let lastMoveY = 0;
let isTouchPointer = false;
let ballSize = BALL_SIZE_DESKTOP;
// Short velocity sample buffer for throw feel
const samples = [];
const SAMPLE_MS = 90;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function isMobileViewport() {
  return (
    typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT
  );
}

function applyTransform() {
  if (!ballEl.value) return;
  // translate3d keeps the layer on the GPU
  ballEl.value.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function measure() {
  if (!container.value) return;
  ballSize = isMobileViewport() ? BALL_SIZE_MOBILE : BALL_SIZE_DESKTOP;
  if (ballEl.value) {
    ballEl.value.style.width = `${ballSize}px`;
    ballEl.value.style.height = `${ballSize}px`;
    ballEl.value.style.fontSize = `${Math.round(ballSize * 0.83)}px`;
  }
  containerW = Math.max(0, container.value.clientWidth - ballSize);
  containerH = Math.max(0, container.value.clientHeight - ballSize);
  x = clamp(x, 0, containerW);
  y = clamp(y, 0, containerH);
  applyTransform();
}

function goalHeightRatio() {
  return isMobileViewport()
    ? GOAL_HEIGHT_RATIO_MOBILE
    : GOAL_HEIGHT_RATIO_DESKTOP;
}

function goalVerticalBand() {
  // Vertical opening of the goal, in ball-center coordinates
  const h = container.value?.clientHeight || 0;
  const goalH = h * goalHeightRatio();
  return {
    top: (h - goalH) / 2,
    bottom: (h - goalH) / 2 + goalH,
  };
}

function triggerGoal() {
  if (goalCooldown) return;
  goalCooldown = true;
  score.value++;
  goalFlash.value = true;
  celebrating.value = true;

  clearTimeout(goalFlashTimeout);
  goalFlashTimeout = setTimeout(() => {
    goalFlash.value = false;
  }, 500);

  clearTimeout(celebrateTimeout);
  celebrateTimeout = setTimeout(() => {
    celebrating.value = false;
  }, 1400);

  // Bounce the ball back out of the goal so it doesn't get stuck
  vx = -Math.abs(vx || 6) * 0.7;
  x = clamp(x - 20, 0, containerW);

  setTimeout(() => {
    goalCooldown = false;
  }, 900);
}

// Only counts as a goal the instant the ball actually reaches the back
// wall (the net) while moving into it and within the goal's vertical
// opening — not just when it enters the wider goal-mouth area.
function checkGoal(hitRightWall, incomingVx) {
  if (!container.value || !hitRightWall) return;
  if (incomingVx <= 2) return; // moving into the net, not a slow drift
  const band = goalVerticalBand();
  const ballCenterY = y + ballSize / 2;
  if (ballCenterY >= band.top && ballCenterY <= band.bottom) {
    triggerGoal();
  }
}

function physics() {
  if (dragging.value) {
    rafId = 0;
    return;
  }

  vy += GRAVITY;
  vx *= FRICTION;
  vy *= FRICTION;

  // Soft air drag when moving fast
  if (Math.abs(vx) > 12) vx *= 0.99;
  if (Math.abs(vy) > 12) vy *= 0.99;

  x += vx;
  y += vy;

  let hitRightWall = false;
  const incomingVx = vx;

  if (x < 0) {
    x = 0;
    vx = Math.abs(vx) * BOUNCE;
  } else if (x > containerW) {
    x = containerW;
    vx = -Math.abs(vx) * BOUNCE;
    hitRightWall = true;
  }
  if (y < 0) {
    y = 0;
    vy = Math.abs(vy) * BOUNCE;
  } else if (y > containerH) {
    y = containerH;
    vy = -Math.abs(vy) * BOUNCE;
    // Ground friction
    vx *= 0.9;
  }

  // Check goal using the wall-contact moment and the velocity the ball
  // actually had going into the wall, so it registers exactly when the
  // ball touches the net — not earlier, while still crossing the mouth.
  checkGoal(hitRightWall, incomingVx);
  applyTransform();

  const resting =
    Math.abs(vx) < REST_EPS && Math.abs(vy) < REST_EPS && y >= containerH - 0.5;

  if (resting) {
    vx = 0;
    vy = 0;
    y = containerH;
    applyTransform();
    rafId = 0;
    return;
  }

  rafId = requestAnimationFrame(physics);
}

function ensureLoop() {
  if (!rafId && !dragging.value) rafId = requestAnimationFrame(physics);
}

function stopLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function onPointerDown(e) {
  if (!container.value || !ballEl.value) return;
  // Only primary button / touch
  if (e.pointerType === "mouse" && e.button !== 0) return;

  isTouchPointer = e.pointerType === "touch" || e.pointerType === "pen";

  const rect = container.value.getBoundingClientRect();
  const localX = e.clientX - rect.left;
  const localY = e.clientY - rect.top;

  // Grab if pointer is near the ball — generous hit area, extra generous on touch
  const grabMult = isTouchPointer ? TOUCH_GRAB_MULT : 0.95;
  const cx = x + ballSize / 2;
  const cy = y + ballSize / 2;
  const dist = Math.hypot(localX - cx, localY - cy);
  if (dist > ballSize * grabMult) {
    // Tap empty pitch → gentle nudge toward pointer
    const dx = localX - cx;
    const dy = localY - cy;
    const len = Math.hypot(dx, dy) || 1;
    vx = (dx / len) * 6;
    vy = (dy / len) * 4 - 2;
    kicks.value++;
    ensureLoop();
    return;
  }

  stopLoop();
  dragging.value = true;
  dragOffsetX = localX - x;
  dragOffsetY = localY - y;
  lastMoveT = performance.now();
  lastMoveX = e.clientX;
  lastMoveY = e.clientY;
  samples.length = 0;
  vx = 0;
  vy = 0;

  pointerId = e.pointerId;
  try {
    container.value.setPointerCapture(e.pointerId);
  } catch {
    /* older browsers */
  }

  // Listen on window so move/up still work if capture fails
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  e.preventDefault();
}

function onPointerMove(e) {
  if (
    !dragging.value ||
    (pointerId != null && e.pointerId !== pointerId) ||
    !container.value
  )
    return;

  // Stop page scroll while dragging on touch devices
  if (e.cancelable) e.preventDefault();

  const rect = container.value.getBoundingClientRect();
  const localX = e.clientX - rect.left;
  const localY = e.clientY - rect.top;

  x = clamp(localX - dragOffsetX, 0, containerW);
  y = clamp(localY - dragOffsetY, 0, containerH);
  applyTransform();

  const now = performance.now();
  const dt = Math.max(1, now - lastMoveT);
  samples.push({
    t: now,
    vx: ((e.clientX - lastMoveX) / dt) * 16.67,
    vy: ((e.clientY - lastMoveY) / dt) * 16.67,
  });
  // Keep only recent samples
  while (samples.length && now - samples[0].t > SAMPLE_MS) samples.shift();

  lastMoveT = now;
  lastMoveX = e.clientX;
  lastMoveY = e.clientY;
}

function onPointerUp(e) {
  if (pointerId != null && e?.pointerId != null && e.pointerId !== pointerId)
    return;
  if (!dragging.value) return;

  // Average recent velocity for a natural throw.
  // Touch samples tend to read slightly lower-frequency than mouse,
  // so give touch throws a small boost to feel equally responsive.
  const touchBoost = isTouchPointer ? 1.15 : 1;
  if (samples.length) {
    let svx = 0;
    let svy = 0;
    for (const s of samples) {
      svx += s.vx;
      svy += s.vy;
    }
    vx = clamp((svx / samples.length) * touchBoost, -MAX_V, MAX_V);
    vy = clamp((svy / samples.length) * touchBoost, -MAX_V, MAX_V);
  } else {
    vx = 0;
    vy = 0;
  }

  // Count a kick if thrown with some force
  if (Math.hypot(vx, vy) > 1.2) {
    kicks.value++;
  }

  const capturedId = pointerId;
  dragging.value = false;
  pointerId = null;
  samples.length = 0;
  cleanupListeners(capturedId);
  ensureLoop();
}

function cleanupListeners(capturedId = null) {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
  const id = capturedId ?? pointerId;
  if (id != null && container.value) {
    try {
      container.value.releasePointerCapture(id);
    } catch {
      /* already released */
    }
  }
}

function confettiStyle(i) {
  const colors = [
    "#f59e0b",
    "#22c55e",
    "#ef4444",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
    "#14b8a6",
  ];
  const s = (n) => {
    const v = Math.sin(n) * 10000;
    return v - Math.floor(v);
  };
  return {
    left: `${s(i * 1) * 100}%`,
    animationDelay: `${s(i * 7) * 0.4}s`,
    animationDuration: `${1 + s(i * 13) * 0.8}s`,
    backgroundColor: colors[i % colors.length],
    width: `${5 + s(i * 5) * 6}px`,
    height: `${5 + s(i * 11) * 6}px`,
    borderRadius: s(i * 3) > 0.5 ? "50%" : "2px",
  };
}

onMounted(() => {
  measure();
  x = Math.random() * Math.max(1, containerW * 0.6);
  y = Math.random() * Math.max(1, containerH * 0.35);
  applyTransform();
  ensureLoop();
  window.addEventListener("resize", measure, { passive: true });
});

onUnmounted(() => {
  stopLoop();
  window.removeEventListener("resize", measure);
  cleanupListeners();
  clearTimeout(goalFlashTimeout);
  clearTimeout(celebrateTimeout);
  dragging.value = false;
  pointerId = null;
});
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
    radial-gradient(
      ellipse 80% 60% at 50% 100%,
      rgba(34, 197, 94, 0.12),
      transparent 60%
    ),
    linear-gradient(160deg, #e8f5e9, #c8e6c9 55%, #dcedc8);
  border: 1px solid color-mix(in srgb, var(--primary) 18%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);

  &.grabbing {
    cursor: grabbing;
  }

  :root.dark & {
    background:
      radial-gradient(
        ellipse 80% 60% at 50% 100%,
        rgba(34, 197, 94, 0.1),
        transparent 60%
      ),
      linear-gradient(160deg, #0a1a0f, #0d1f14 55%, #0a1610);
    border-color: rgba(34, 197, 94, 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  /* Shorter on small phones — this is a footer filler, not a core feature */
  @media (max-width: 480px) {
    height: 170px;
    border-radius: 16px;
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
  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
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

/* ── Goal ─────────────────────────────────────────── */
.goal {
  position: absolute;
  right: 6px;
  top: 25%;
  bottom: 25%;
  width: 22%;
  max-width: 60px;
  pointer-events: none;
  z-index: 1;
  transition: filter 0.2s ease;
  @media (max-width: 480px) {
    top: 30%;
    bottom: 30%;
    width: 16%;
    max-width: 34px;
    right: 4px;
  }
}
.goal-post {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--primary) 55%, #fff);
  :root.dark & {
    background: rgba(255, 255, 255, 0.55);
  }
  @media (max-width: 480px) {
    height: 2px;
  }
}
.goal-post-top {
  top: 0;
}
.goal-post-bottom {
  bottom: 0;
}
.goal-net {
  position: absolute;
  inset: 3px 0;
  background-image:
    repeating-linear-gradient(
      0deg,
      color-mix(in srgb, var(--primary) 25%, transparent) 0 1px,
      transparent 1px 10px
    ),
    repeating-linear-gradient(
      90deg,
      color-mix(in srgb, var(--primary) 25%, transparent) 0 1px,
      transparent 1px 10px
    );
  opacity: 0.5;
  border-inline-end: 2px solid
    color-mix(in srgb, var(--primary) 40%, transparent);
  :root.dark & {
    opacity: 0.3;
  }
}
.goal-flash {
  filter: drop-shadow(
    0 0 10px color-mix(in srgb, var(--primary) 60%, transparent)
  );
}

/* ── Ball ─────────────────────────────────────────── */
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

/* ── Score badges ─────────────────────────────────── */
.score-badges {
  position: absolute;
  top: 10px;
  inset-inline-end: 10px;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  pointer-events: none;
}
.score-badge {
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
  backdrop-filter: blur(6px);
}
.goal-score {
  color: #ca8a04;
  background: rgba(234, 179, 8, 0.14);
  border-color: rgba(234, 179, 8, 0.3);
}

/* ── Goal celebration ─────────────────────────────── */
.goal-banner {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 1px;
  color: #ca8a04;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  animation: goal-pop 1.4s ease-out forwards;
  pointer-events: none;
}
@keyframes goal-pop {
  0% {
    opacity: 0;
    transform: translateX(-50%) scale(0.6) translateY(6px);
  }
  15% {
    opacity: 1;
    transform: translateX(-50%) scale(1.1) translateY(0);
  }
  25% {
    transform: translateX(-50%) scale(1) translateY(0);
  }
  75% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) scale(1) translateY(-4px);
  }
}

.goal-confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 4;
}
.goal-confetti .confetti-piece {
  position: absolute;
  top: -10px;
  animation-name: goal-confetti-fall;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  opacity: 0.9;
}
@keyframes goal-confetti-fall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(220px) rotate(500deg);
    opacity: 0;
  }
}
</style>
