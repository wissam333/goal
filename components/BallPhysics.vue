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
      <div class="pitch-box" />
    </div>

    <!-- Goal: net sits behind posts; keeper stands in front of the mouth -->
    <div
      class="goal"
      :class="{ 'goal-flash': goalFlash, 'goal-bulge': netBulge }"
      aria-hidden="true"
    >
      <!-- Depth net (back) -->
      <div class="goal-net">
        <div class="net-mesh" />
        <div class="net-depth" />
        <div class="net-shadow" />
      </div>
      <!-- Frame posts (front of net) -->
      <div class="goal-post goal-post-back" />
      <div class="goal-post goal-post-top" />
      <div class="goal-post goal-post-bottom" />
      <div class="goal-post goal-post-front" />
    </div>

    <!-- Goalkeeper — classic side-view shape, compact size -->
    <div
      ref="keeperEl"
      class="keeper"
      :class="{ save: keeperSave }"
      aria-hidden="true"
    >
      <div class="keeper-shadow" />
      <div class="keeper-body">
        <div class="keeper-head">
          <span class="keeper-hair" />
        </div>
        <div class="keeper-arms">
          <span class="arm arm-l" />
          <span class="arm arm-r" />
        </div>
        <div class="keeper-torso">
          <span class="keeper-badge" />
        </div>
        <div class="keeper-gloves">
          <span class="glove glove-l" />
          <span class="glove glove-r" />
        </div>
        <div class="keeper-legs">
          <span class="leg leg-l" />
          <span class="leg leg-r" />
        </div>
      </div>
    </div>

    <!-- Taunt bubble (separate so it stays upright while keeper turns) -->
    <div
      v-if="keeperSave && tauntText"
      class="keeper-taunt"
      :style="tauntStyle"
    >
      {{ tauntText }}
    </div>

    <div ref="ballEl" class="ball" :class="{ active: dragging }">
      <Icon name="game-icons:soccer-ball" />
    </div>

    <!-- Goal celebration confetti -->
    <div v-if="celebrating" class="goal-confetti" aria-hidden="true">
      <div
        v-for="i in 14"
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
        <Icon name="mdi:soccer" size="12" />
        {{ score }}
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Smooth ball physics mini-game.
 * Sharp keeper + tighter goal — place shots carefully to score.
 */
const GRAVITY = 0.28;
const FRICTION = 0.991;
const BOUNCE = 0.58;
const BALL_SIZE_DESKTOP = 44;
const BALL_SIZE_MOBILE = 34;
const MAX_V = 24;
const REST_EPS = 0.08;
const MOBILE_BREAKPOINT = 480;

// Mobile touch tuning — slightly less free power so placement matters
const TOUCH_GRAB_MULT = 1.75;
const TOUCH_THROW_BOOST = 1.12;

// Goal opening height as % of container (smaller = harder)
const GOAL_HEIGHT_RATIO_DESKTOP = 0.42;
const GOAL_HEIGHT_RATIO_MOBILE = 0.4;

// Goalkeeper size — bulkier so corners are harder to sneak past
const KEEPER_W_DESKTOP = 24;
const KEEPER_H_DESKTOP = 44;
const KEEPER_W_MOBILE = 20;
const KEEPER_H_MOBILE = 38;

// Syrian / Arabic taunts when the keeper saves
const KEEPER_TAUNTS = [
  "هههه",
  "نووووب",
  "عم تمزح ما؟",
  "سهلة 😎",
  "بعدين يا كبير",
  "ماشي الحال",
  "حاول كمان",
  "ليش هيك؟",
  "والله نوب",
  "نام شوي",
  "يلا كمان!",
  "امسح العار",
  "مش هيك",
  "فاشل 😂",
  "وين رايح؟",
  "مطول يا غالي؟",
  "تاني مرة",
  "لاااا",
  "هههههههه",
  "بدك علمك؟",
];

// AI: sharp, fast keeper — corners and fakes still work, but mid-shots die
const KEEPER_SPEED = 1.35;
const KEEPER_DIVE_SPEED = 2.45;
const KEEPER_REACTION_LAG = 0.28; // 0 = perfect, 1 = very lazy
const KEEPER_GAP_FROM_NET_DESKTOP = 16; // px in front of net mouth
const KEEPER_GAP_FROM_NET_MOBILE = 12;

// Steel goal posts — solid colliders
const POST_THICK_DESKTOP = 6;
const POST_THICK_MOBILE = 5;
const POST_BOUNCE = 0.72;

const container = ref(null);
const ballEl = ref(null);
const keeperEl = ref(null);
const kicks = ref(0);
const score = ref(0);
const dragging = ref(false);
const goalFlash = ref(false);
const celebrating = ref(false);
const keeperSave = ref(false);
const tauntText = ref("");
const tauntStyle = ref({});
const netBulge = ref(false);

let goalFlashTimeout = null;
let celebrateTimeout = null;
let saveTimeout = null;
let netBulgeTimeout = null;
let goalCooldown = false;
let saveCooldown = false;

// Non-reactive physics state (avoids Vue re-renders every frame)
let x = 0;
let y = 0;
let vx = 2.2;
let vy = 0;
let containerW = 0;
let containerH = 0;
let fullW = 0;
let fullH = 0;
let rafId = 0;
let pointerId = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastMoveT = 0;
let lastMoveX = 0;
let lastMoveY = 0;
let isTouchPointer = false;
let ballSize = BALL_SIZE_DESKTOP;
// Keeper state (top-left of sprite)
let keeperX = 0;
let keeperY = 0;
let keeperW = KEEPER_W_DESKTOP;
let keeperH = KEEPER_H_DESKTOP;
let keeperGap = KEEPER_GAP_FROM_NET_DESKTOP;
let keeperInited = false;
// Soft target with lag for human-like reaction
let keeperTargetY = 0;
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
  ballEl.value.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function applyKeeperTransform() {
  if (!keeperEl.value) return;
  // Slight lean toward the ball while diving
  const lean =
    Math.abs(vx) > 2 || dragging.value
      ? clamp((y + ballSize / 2 - (keeperY + keeperH / 2)) * 0.08, -6, 6)
      : 0;
  keeperEl.value.style.transform = `translate3d(${keeperX}px, ${keeperY}px, 0) rotate(${lean}deg)`;
  keeperEl.value.style.width = `${keeperW}px`;
  keeperEl.value.style.height = `${keeperH}px`;
}

function pickTaunt() {
  return KEEPER_TAUNTS[Math.floor(Math.random() * KEEPER_TAUNTS.length)];
}

function goalHeightRatio() {
  return isMobileViewport()
    ? GOAL_HEIGHT_RATIO_MOBILE
    : GOAL_HEIGHT_RATIO_DESKTOP;
}

function goalVerticalBand() {
  const h = fullH || container.value?.clientHeight || 0;
  const goalH = h * goalHeightRatio();
  return {
    top: (h - goalH) / 2,
    bottom: (h - goalH) / 2 + goalH,
  };
}

/** Left edge of the goal mouth (posts), in container coords */
function goalMouthX() {
  // Matches CSS: goal is ~right-aligned, width ~22% / max 72 desktop, 20% / max 48 mobile
  const mobile = isMobileViewport();
  const goalW = Math.min(
    mobile ? 48 : 72,
    (fullW || 0) * (mobile ? 0.2 : 0.22),
  );
  const rightPad = mobile ? 5 : 8;
  return (fullW || 0) - rightPad - goalW;
}

function postThickness() {
  return isMobileViewport() ? POST_THICK_MOBILE : POST_THICK_DESKTOP;
}

/** Steel frame geometry in absolute container coords (matches CSS goal) */
function goalFrame() {
  const band = goalVerticalBand();
  const mouthX = goalMouthX();
  const thick = postThickness();
  const right = fullW || 0;
  return {
    mouthX,
    right,
    top: band.top,
    bottom: band.bottom,
    thick,
    // Horizontal crossbars span the goal depth
    topBar: {
      x: mouthX,
      y: band.top - thick / 2,
      w: Math.max(thick, right - mouthX),
      h: thick,
    },
    bottomBar: {
      x: mouthX,
      y: band.bottom - thick / 2,
      w: Math.max(thick, right - mouthX),
      h: thick,
    },
    // Front upright (the steel post at the mouth)
    frontPost: {
      x: mouthX - thick / 2,
      y: band.top,
      w: thick,
      h: Math.max(thick, band.bottom - band.top),
    },
  };
}

/**
 * Resolve circle (ball) vs axis-aligned steel post.
 * Returns true if a collision was applied.
 */
function resolvePostHit(rect) {
  const ballR = ballSize * 0.46;
  const ballCx = x + ballSize / 2;
  const ballCy = y + ballSize / 2;

  // Closest point on the post rectangle to the ball center
  const nearestX = clamp(ballCx, rect.x, rect.x + rect.w);
  const nearestY = clamp(ballCy, rect.y, rect.y + rect.h);
  let dx = ballCx - nearestX;
  let dy = ballCy - nearestY;
  const distSq = dx * dx + dy * dy;
  if (distSq > ballR * ballR) return false;

  let dist = Math.sqrt(distSq);
  // Ball center embedded inside the post — push out along shallowest axis
  if (dist < 0.0001) {
    const leftPen = ballCx + ballR - rect.x;
    const rightPen = rect.x + rect.w - (ballCx - ballR);
    const topPen = ballCy + ballR - rect.y;
    const bottomPen = rect.y + rect.h - (ballCy - ballR);
    const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
    if (minPen === leftPen) {
      x = rect.x - ballSize;
      if (vx > 0) vx = -Math.abs(vx) * POST_BOUNCE;
    } else if (minPen === rightPen) {
      x = rect.x + rect.w;
      if (vx < 0) vx = Math.abs(vx) * POST_BOUNCE;
    } else if (minPen === topPen) {
      y = rect.y - ballSize;
      if (vy > 0) vy = -Math.abs(vy) * POST_BOUNCE;
    } else {
      y = rect.y + rect.h;
      if (vy < 0) vy = Math.abs(vy) * POST_BOUNCE;
    }
    return true;
  }

  // Normal from post surface → ball
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = ballR - dist;
  // Separate so ball rests on the steel, not inside it
  x += nx * overlap;
  y += ny * overlap;

  // Reflect velocity off the surface (only if moving into it)
  const vn = vx * nx + vy * ny;
  if (vn < 0) {
    vx = (vx - 2 * vn * nx) * POST_BOUNCE;
    vy = (vy - 2 * vn * ny) * POST_BOUNCE;
    // Metallic “clang” — tiny extra kick away from post
    vx += nx * 0.8;
    vy += ny * 0.8;
  }

  // Clamp to pitch after separation
  x = clamp(x, 0, containerW);
  y = clamp(y, 0, containerH);
  return true;
}

/**
 * Solid steel posts — ball clangs off bars/corners, cannot pass through.
 * Opening between the bars stays free so goals remain possible.
 */
function collideGoalPosts() {
  if (!fullW) return false;
  const frame = goalFrame();
  const ballCx = x + ballSize / 2;
  // Cheap early-out: only near the goal
  if (ballCx < frame.mouthX - ballSize) return false;

  let hit = false;
  const thick = frame.thick;
  // Slightly fatter than paint so contact feels solid on mobile
  const solid = Math.max(thick, isMobileViewport() ? 7 : 8);

  // Top crossbar (full depth of the goal)
  if (
    resolvePostHit({
      x: frame.mouthX - solid * 0.35,
      y: frame.top - solid / 2,
      w: frame.right - frame.mouthX + solid * 0.35,
      h: solid,
    })
  ) {
    hit = true;
  }
  // Bottom crossbar
  if (
    resolvePostHit({
      x: frame.mouthX - solid * 0.35,
      y: frame.bottom - solid / 2,
      w: frame.right - frame.mouthX + solid * 0.35,
      h: solid,
    })
  ) {
    hit = true;
  }

  // Front upright is only solid at the corner joints (not the open mouth).
  // That gives real "post" clang when you hit the steel corners.
  const joint = solid * 1.6;
  // Top-front corner
  if (
    resolvePostHit({
      x: frame.mouthX - solid * 0.55,
      y: frame.top - solid * 0.35,
      w: solid * 1.15,
      h: joint,
    })
  ) {
    hit = true;
  }
  // Bottom-front corner
  if (
    resolvePostHit({
      x: frame.mouthX - solid * 0.55,
      y: frame.bottom - joint + solid * 0.35,
      w: solid * 1.15,
      h: joint,
    })
  ) {
    hit = true;
  }
  // Back upright joints (rear corners of the steel frame)
  if (
    resolvePostHit({
      x: frame.right - solid,
      y: frame.top - solid * 0.35,
      w: solid,
      h: joint,
    })
  ) {
    hit = true;
  }
  if (
    resolvePostHit({
      x: frame.right - solid,
      y: frame.bottom - joint + solid * 0.35,
      w: solid,
      h: joint,
    })
  ) {
    hit = true;
  }

  return hit;
}

function measure() {
  if (!container.value) return;
  const mobile = isMobileViewport();
  ballSize = mobile ? BALL_SIZE_MOBILE : BALL_SIZE_DESKTOP;
  keeperW = mobile ? KEEPER_W_MOBILE : KEEPER_W_DESKTOP;
  keeperH = mobile ? KEEPER_H_MOBILE : KEEPER_H_DESKTOP;
  keeperGap = mobile ? KEEPER_GAP_FROM_NET_MOBILE : KEEPER_GAP_FROM_NET_DESKTOP;

  fullW = container.value.clientWidth;
  fullH = container.value.clientHeight;
  if (ballEl.value) {
    ballEl.value.style.width = `${ballSize}px`;
    ballEl.value.style.height = `${ballSize}px`;
    ballEl.value.style.fontSize = `${Math.round(ballSize * 0.83)}px`;
  }
  containerW = Math.max(0, fullW - ballSize);
  containerH = Math.max(0, fullH - ballSize);
  x = clamp(x, 0, containerW);
  y = clamp(y, 0, containerH);

  // Keeper stands clearly IN FRONT of the net (to the left of the posts)
  const mouthX = goalMouthX();
  keeperX = mouthX - keeperW - keeperGap * 0.15;
  // Keep him just outside the goal box so he reads as "in front"
  keeperX = clamp(keeperX, mouthX - keeperW - 4, mouthX - keeperW * 0.35);

  const band = goalVerticalBand();
  // Allow a little reach beyond pure goal height for dive feel
  const minY = band.top - keeperH * 0.05;
  const maxY = Math.max(minY, band.bottom - keeperH * 0.9);
  if (!keeperInited) {
    keeperY = (minY + maxY) / 2;
    keeperTargetY = keeperY;
    keeperInited = true;
  }
  keeperY = clamp(keeperY, minY, maxY);
  keeperTargetY = clamp(keeperTargetY, minY, maxY);

  applyTransform();
  applyKeeperTransform();
}

function triggerGoal() {
  if (goalCooldown) return;
  goalCooldown = true;
  score.value++;
  goalFlash.value = true;
  celebrating.value = true;
  netBulge.value = true;

  clearTimeout(goalFlashTimeout);
  goalFlashTimeout = setTimeout(() => {
    goalFlash.value = false;
  }, 520);

  clearTimeout(netBulgeTimeout);
  netBulgeTimeout = setTimeout(() => {
    netBulge.value = false;
  }, 480);

  clearTimeout(celebrateTimeout);
  celebrateTimeout = setTimeout(() => {
    celebrating.value = false;
  }, 1300);

  // Soft bounce out of the net
  vx = -Math.abs(vx || 6) * 0.65;
  x = clamp(x - 18, 0, containerW);

  setTimeout(() => {
    goalCooldown = false;
  }, 1100);
}

function triggerSave() {
  if (saveCooldown) return;
  saveCooldown = true;
  keeperSave.value = true;
  tauntText.value = pickTaunt();
  // Place bubble just above the keeper (container coords)
  tauntStyle.value = {
    left: `${Math.round(keeperX + keeperW / 2)}px`,
    top: `${Math.round(Math.max(6, keeperY - 8))}px`,
  };
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    keeperSave.value = false;
    tauntText.value = "";
    tauntStyle.value = {};
    saveCooldown = false;
  }, 1100);

  // Stronger parry — rebounds farther so follow-up shots are harder
  const ballCenterY = y + ballSize / 2;
  const keeperCenterY = keeperY + keeperH / 2;
  const offset = clamp(
    (ballCenterY - keeperCenterY) / Math.max(1, keeperH / 2),
    -1,
    1,
  );
  const power = Math.max(7.5, Math.abs(vx) * 0.95);
  vx = -power;
  vy = clamp(vy * 0.35 + offset * 6.5 - 1.5, -13, 10);
  x = clamp(keeperX - ballSize + 2, 0, containerW);
}

function checkGoal(hitRightWall, incomingVx) {
  if (!container.value || !hitRightWall) return;
  // Need real power — soft rolls into the net no longer count
  if (incomingVx <= 2.6) return;
  const frame = goalFrame();
  const ballCenterY = y + ballSize / 2;
  const thick = frame.thick;
  // Must pass cleanly between the steel bars (not through posts)
  const openTop = frame.top + thick * 0.75;
  const openBottom = frame.bottom - thick * 0.75;
  if (ballCenterY >= openTop && ballCenterY <= openBottom) {
    triggerGoal();
  }
}

function updateKeeper() {
  if (!container.value) return;
  const band = goalVerticalBand();
  // Cover almost the full mouth — only extreme corners stay open
  const minY = band.top - keeperH * 0.02;
  const maxY = Math.max(
    minY,
    band.bottom - keeperH * 0.72,
  );
  const ballCenterY = y + ballSize / 2;
  const keeperCenterY = keeperY + keeperH / 2;

  // Reacts early — starts reading the shot from midfield
  const incoming = dragging.value || (vx > 1.1 && x > containerW * 0.28);
  const mobile = isMobileViewport();
  const diveSpeed = mobile ? KEEPER_DIVE_SPEED * 0.92 : KEEPER_DIVE_SPEED;
  // Still tracks while aiming so soft placements get punished
  const speed = dragging.value
    ? diveSpeed * 0.78
    : incoming
      ? diveSpeed
      : KEEPER_SPEED;

  if (keeperEl.value) {
    keeperEl.value.classList.toggle("dive", incoming && !dragging.value);
  }

  let desiredCenter = ballCenterY;
  if (incoming && !dragging.value && Math.abs(vx) > 0.4) {
    // Strong look-ahead — anticipates flight path into the box
    const framesToKeeper = Math.max(1, (keeperX - x) / Math.max(vx, 0.5));
    desiredCenter = ballCenterY + vy * Math.min(framesToKeeper, 14) * 0.72;
  } else if (dragging.value) {
    // Sticks closer to the ball while you aim — fakes need commitment
    desiredCenter = ballCenterY * 0.82 + (fullH / 2) * 0.18;
  } else {
    desiredCenter = fullH / 2;
  }

  // Light reaction lag — still human, not telepathic
  const lag = dragging.value
    ? Math.min(0.42, KEEPER_REACTION_LAG + 0.06)
    : incoming
      ? KEEPER_REACTION_LAG * 0.7
      : KEEPER_REACTION_LAG;
  keeperTargetY += (desiredCenter - keeperH / 2 - keeperTargetY) * (1 - lag);

  const delta = keeperTargetY + keeperH / 2 - keeperCenterY;
  // Tight deadzone = sticky coverage across the mouth
  if (Math.abs(delta) > 0.9) {
    keeperY += clamp(delta * 0.72, -speed, speed);
  }
  keeperY = clamp(keeperY, minY, maxY);
  applyKeeperTransform();
}

function ballHitsKeeper() {
  const ballR = ballSize * 0.42;
  const ballCx = x + ballSize / 2;
  const ballCy = y + ballSize / 2;
  // Generous gloves/torso hitbox — only tight corners beat him
  const padX = keeperW * 0.04;
  const padY = keeperH * 0.06;
  const left = keeperX + padX;
  const right = keeperX + keeperW - padX * 0.2;
  const top = keeperY + padY;
  const bottom = keeperY + keeperH - padY * 0.35;

  return (
    ballCx + ballR > left &&
    ballCx - ballR < right &&
    ballCy + ballR > top &&
    ballCy - ballR < bottom
  );
}

function physics() {
  if (dragging.value) {
    updateKeeper();
    rafId = requestAnimationFrame(physics);
    return;
  }

  vy += GRAVITY;
  vx *= FRICTION;
  vy *= FRICTION;

  if (Math.abs(vx) > 12) vx *= 0.99;
  if (Math.abs(vy) > 12) vy *= 0.99;

  x += vx;
  y += vy;

  let hitRightWall = false;
  const incomingVx = vx;

  updateKeeper();

  // Steel posts are solid bodies — resolve before keeper / wall
  const hitPostEarly = collideGoalPosts();

  // Save before wall so keeper (in front of net) can block
  if (!hitPostEarly && vx > 0.7 && ballHitsKeeper()) {
    triggerSave();
  }

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
    vx *= 0.9;
  }

  // Re-check posts after wall clamp (ball can clip a corner)
  const hitPostLate = collideGoalPosts();
  const blockedBySteel = hitPostEarly || hitPostLate;

  // No goal if we just clanged off the steel
  if (!saveCooldown && !blockedBySteel) {
    checkGoal(hitRightWall, incomingVx);
  }
  applyTransform();

  const resting =
    Math.abs(vx) < REST_EPS && Math.abs(vy) < REST_EPS && y >= containerH - 0.5;

  if (resting) {
    vx = 0;
    vy = 0;
    y = containerH;
    applyTransform();
    updateKeeper();
    if (keeperEl.value) keeperEl.value.classList.add("idle");
    rafId = 0;
    return;
  }

  if (keeperEl.value) keeperEl.value.classList.remove("idle");
  rafId = requestAnimationFrame(physics);
}

function ensureLoop() {
  if (keeperEl.value) keeperEl.value.classList.remove("idle");
  if (!rafId) rafId = requestAnimationFrame(physics);
}

function stopLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function onPointerDown(e) {
  if (!container.value || !ballEl.value) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;

  isTouchPointer = e.pointerType === "touch" || e.pointerType === "pen";

  const rect = container.value.getBoundingClientRect();
  const localX = e.clientX - rect.left;
  const localY = e.clientY - rect.top;

  const grabMult = isTouchPointer ? TOUCH_GRAB_MULT : 1.0;
  const cx = x + ballSize / 2;
  const cy = y + ballSize / 2;
  const dist = Math.hypot(localX - cx, localY - cy);
  if (dist > ballSize * grabMult) {
    // Tap empty pitch → gentle nudge toward pointer
    const dx = localX - cx;
    const dy = localY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const power = isTouchPointer ? 5.8 : 5;
    vx = (dx / len) * power;
    vy = (dy / len) * (power * 0.6) - 1.6;
    kicks.value++;
    ensureLoop();
    return;
  }

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

  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  ensureLoop();
  e.preventDefault();
}

function onPointerMove(e) {
  if (
    !dragging.value ||
    (pointerId != null && e.pointerId !== pointerId) ||
    !container.value
  )
    return;

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
  while (samples.length && now - samples[0].t > SAMPLE_MS) samples.shift();

  lastMoveT = now;
  lastMoveX = e.clientX;
  lastMoveY = e.clientY;
}

function onPointerUp(e) {
  if (pointerId != null && e?.pointerId != null && e.pointerId !== pointerId)
    return;
  if (!dragging.value) return;

  const touchBoost = isTouchPointer ? TOUCH_THROW_BOOST : 1;
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

  // Mild flick assist — soft throws still move, but need real aim
  if (isTouchPointer && Math.hypot(vx, vy) > 0.6 && Math.hypot(vx, vy) < 3.2) {
    const len = Math.hypot(vx, vy) || 1;
    vx = (vx / len) * 4.2;
    vy = (vy / len) * 3.4;
  }

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
    animationDelay: `${s(i * 7) * 0.35}s`,
    animationDuration: `${0.95 + s(i * 13) * 0.7}s`,
    backgroundColor: colors[i % colors.length],
    width: `${5 + s(i * 5) * 5}px`,
    height: `${5 + s(i * 11) * 5}px`,
    borderRadius: s(i * 3) > 0.5 ? "50%" : "2px",
  };
}

onMounted(() => {
  measure();
  // Start ball mid-left so goal + keeper are visible as the "stage"
  x = Math.random() * Math.max(1, containerW * 0.45);
  y = Math.random() * Math.max(1, containerH * 0.4);
  applyTransform();
  applyKeeperTransform();
  ensureLoop();
  window.addEventListener("resize", measure, { passive: true });
});

onUnmounted(() => {
  stopLoop();
  window.removeEventListener("resize", measure);
  cleanupListeners();
  clearTimeout(goalFlashTimeout);
  clearTimeout(celebrateTimeout);
  clearTimeout(saveTimeout);
  clearTimeout(netBulgeTimeout);
  dragging.value = false;
  pointerId = null;
});
</script>

<style scoped>
.ball-physics {
  position: relative;
  overflow: hidden;
  height: 230px;
  border-radius: 20px;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  background:
    radial-gradient(
      ellipse 70% 50% at 88% 50%,
      rgba(255, 255, 255, 0.14),
      transparent 55%
    ),
    radial-gradient(
      ellipse 80% 60% at 50% 100%,
      rgba(34, 197, 94, 0.14),
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
        ellipse 70% 50% at 88% 50%,
        rgba(255, 255, 255, 0.04),
        transparent 55%
      ),
      radial-gradient(
        ellipse 80% 60% at 50% 100%,
        rgba(34, 197, 94, 0.1),
        transparent 60%
      ),
      linear-gradient(160deg, #0a1a0f, #0d1f14 55%, #0a1610);
    border-color: rgba(34, 197, 94, 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  @media (max-width: 480px) {
    height: 196px;
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
  @media (max-width: 480px) {
    inset: 8px;
    border-radius: 10px;
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
    width: 38px;
    height: 38px;
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

/* Penalty-ish box near the goal */
.pitch-box {
  position: absolute;
  top: 18%;
  bottom: 18%;
  right: 0;
  width: 22%;
  max-width: 90px;
  border: 1.5px solid color-mix(in srgb, var(--primary) 20%, transparent);
  border-right: none;
  border-radius: 8px 0 0 8px;
  opacity: 0.85;
  :root.dark & {
    border-color: rgba(255, 255, 255, 0.08);
  }
  @media (max-width: 480px) {
    width: 26%;
    max-width: 70px;
    top: 16%;
    bottom: 16%;
  }
}

/* ── Goal (net behind, posts in front) — matches GOAL_HEIGHT_RATIO ── */
.goal {
  position: absolute;
  right: 8px;
  top: 29%;
  bottom: 29%;
  width: 22%;
  max-width: 72px;
  pointer-events: none;
  z-index: 1;
  transition: filter 0.2s ease;
  perspective: 120px;
  @media (max-width: 480px) {
    top: 30%;
    bottom: 30%;
    width: 20%;
    max-width: 48px;
    right: 5px;
  }
}

.goal-net {
  position: absolute;
  inset: 3px 0 3px 2px;
  overflow: hidden;
  border-radius: 2px 4px 4px 2px;
  transform-origin: left center;
  transform: perspective(90px) rotateY(-12deg);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.02) 40%,
    rgba(0, 0, 0, 0.04)
  );
  :root.dark & {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05),
      rgba(255, 255, 255, 0.02) 40%,
      rgba(0, 0, 0, 0.2)
    );
  }
}

.net-mesh {
  position: absolute;
  inset: 0;
  background-image:
    /* diamond-ish soccer net via two diagonal grids */
    repeating-linear-gradient(
      28deg,
      transparent 0 7px,
      rgba(255, 255, 255, 0.55) 7px 8px
    ),
    repeating-linear-gradient(
      -28deg,
      transparent 0 7px,
      rgba(255, 255, 255, 0.45) 7px 8px
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0 9px,
      rgba(255, 255, 255, 0.18) 9px 10px
    );
  opacity: 0.72;
  mix-blend-mode: soft-light;
  :root.dark & {
    opacity: 0.55;
    background-image:
      repeating-linear-gradient(
        28deg,
        transparent 0 7px,
        rgba(255, 255, 255, 0.35) 7px 8px
      ),
      repeating-linear-gradient(
        -28deg,
        transparent 0 7px,
        rgba(255, 255, 255, 0.28) 7px 8px
      ),
      repeating-linear-gradient(
        90deg,
        transparent 0 9px,
        rgba(255, 255, 255, 0.12) 9px 10px
      );
  }
  @media (max-width: 480px) {
    background-image:
      repeating-linear-gradient(
        28deg,
        transparent 0 5px,
        rgba(255, 255, 255, 0.55) 5px 6px
      ),
      repeating-linear-gradient(
        -28deg,
        transparent 0 5px,
        rgba(255, 255, 255, 0.45) 5px 6px
      );
  }
}

.net-depth {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 0, 0, 0.06) 70%,
    rgba(0, 0, 0, 0.14) 100%
  );
  pointer-events: none;
}

.net-shadow {
  position: absolute;
  inset: 0;
  box-shadow:
    inset -6px 0 10px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  pointer-events: none;
  :root.dark & {
    box-shadow:
      inset -6px 0 12px rgba(0, 0, 0, 0.35),
      inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  }
}

.goal-post {
  position: absolute;
  /* Brushed steel look */
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #e8edf2 35%,
    #b8c0c8 70%,
    #9aa3ad 100%
  );
  border-radius: 3px;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    inset 0 -1px 0 rgba(15, 23, 42, 0.12);
  :root.dark & {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.88),
      rgba(203, 213, 225, 0.7) 50%,
      rgba(148, 163, 184, 0.55)
    );
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }
}

.goal-post-top,
.goal-post-bottom {
  left: 0;
  right: 0;
  height: 6px;
  z-index: 3;
  @media (max-width: 480px) {
    height: 5px;
  }
}
.goal-post-top {
  top: -1px;
  border-radius: 4px 4px 2px 2px;
}
.goal-post-bottom {
  bottom: -1px;
  border-radius: 2px 2px 4px 4px;
}

.goal-post-front {
  top: -1px;
  bottom: -1px;
  left: -1px;
  width: 6px;
  background: linear-gradient(90deg, #ffffff 0%, #dfe5eb 45%, #94a3b8 100%);
  border-radius: 3px;
  z-index: 4;
  box-shadow:
    1px 0 2px rgba(15, 23, 42, 0.18),
    inset 1px 0 0 rgba(255, 255, 255, 0.7);
  @media (max-width: 480px) {
    width: 5px;
  }
}

.goal-post-back {
  top: 1px;
  bottom: 1px;
  right: 0;
  width: 4px;
  opacity: 0.85;
  background: linear-gradient(90deg, #c5ced6, #8b959e);
  z-index: 2;
  @media (max-width: 480px) {
    width: 3px;
  }
}

/* Steel corner caps so joints read as solid metal */
.goal-post-top::before,
.goal-post-bottom::before {
  content: "";
  position: absolute;
  left: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff, #b0b8c0 70%, #8a929a);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  @media (max-width: 480px) {
    width: 8px;
    height: 8px;
  }
}
.goal-post-top::before {
  top: -2px;
}
.goal-post-bottom::before {
  bottom: -2px;
  top: auto;
}

.goal-flash {
  filter: drop-shadow(
    0 0 12px color-mix(in srgb, var(--primary) 65%, transparent)
  );
}

.goal-bulge .goal-net {
  animation: net-bulge 0.48s ease-out;
}
@keyframes net-bulge {
  0% {
    transform: perspective(90px) rotateY(-12deg) scaleX(1);
  }
  35% {
    transform: perspective(90px) rotateY(-8deg) scaleX(1.12) translateX(3px);
  }
  100% {
    transform: perspective(90px) rotateY(-12deg) scaleX(1);
  }
}

/* ── Goalkeeper (classic shape, compact) ──────────── */
.keeper {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  pointer-events: none;
  will-change: transform;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25));
  transition: filter 0.15s ease;

  &.idle .keeper-body {
    animation: keeper-breathe 2.4s ease-in-out infinite;
  }

  &.dive .arm {
    transform: scaleX(1.12);
  }
  &.dive .glove {
    transform: scale(1.1);
  }
  &.dive .keeper-legs .leg-l {
    transform: rotate(-8deg);
  }
  &.dive .keeper-legs .leg-r {
    transform: rotate(8deg);
  }

  &.save {
    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--primary) 55%, #fff));
  }

  :root.dark & {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    &.save {
      filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.5));
    }
  }
}

@keyframes keeper-breathe {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-1.5px);
  }
}

.keeper-shadow {
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: -4%;
  height: 10%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.16);
  filter: blur(2px);
  :root.dark & {
    background: rgba(0, 0, 0, 0.32);
  }
}

.keeper-body {
  position: relative;
  width: 100%;
  height: 100%;
}

.keeper-head {
  position: absolute;
  top: 0;
  left: 50%;
  width: 42%;
  height: 20%;
  border-radius: 50%;
  background: linear-gradient(180deg, #f5d0a9, #e8b88a);
  transform: translateX(-50%);
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.08);
  z-index: 2;
  :root.dark & {
    background: linear-gradient(180deg, #e0b48a, #c9966a);
  }
}

.keeper-hair {
  position: absolute;
  top: -12%;
  left: 12%;
  right: 12%;
  height: 45%;
  border-radius: 50% 50% 20% 20%;
  background: #1e293b;
  :root.dark & {
    background: #0f172a;
  }
}

.keeper-arms {
  position: absolute;
  top: 24%;
  left: 0;
  right: 0;
  height: 14%;
  z-index: 1;
}

.arm {
  position: absolute;
  top: 0;
  width: 22%;
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--primary) 80%, #fff),
    color-mix(in srgb, var(--primary) 65%, #000)
  );
  transition: transform 0.12s ease;
  transform-origin: top center;
}
.arm-l {
  left: 2%;
  transform: rotate(18deg);
}
.arm-r {
  right: 2%;
  transform: rotate(-18deg);
}

.keeper-torso {
  position: absolute;
  top: 20%;
  left: 50%;
  width: 58%;
  height: 36%;
  border-radius: 6px 6px 4px 4px;
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--primary) 88%, #fff),
    color-mix(in srgb, var(--primary) 72%, #000)
  );
  transform: translateX(-50%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 1px 2px rgba(0, 0, 0, 0.12);
  z-index: 2;
}

.keeper-badge {
  position: absolute;
  top: 18%;
  left: 50%;
  width: 28%;
  height: 22%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  transform: translateX(-50%);
}

.keeper-gloves {
  position: absolute;
  top: 28%;
  left: 0;
  right: 0;
  height: 18%;
  z-index: 3;
  pointer-events: none;
}

.glove {
  position: absolute;
  top: 0;
  width: 30%;
  height: 100%;
  border-radius: 45% 45% 50% 50%;
  background: linear-gradient(180deg, #fff, #e2e8f0);
  border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.14);
  transition: transform 0.12s ease;
  :root.dark & {
    background: linear-gradient(180deg, #f1f5f9, #cbd5e1);
    border-color: rgba(255, 255, 255, 0.2);
  }
}
.glove-l {
  left: -10%;
}
.glove-r {
  right: -10%;
}

.keeper-legs {
  position: absolute;
  top: 54%;
  left: 50%;
  width: 72%;
  height: 44%;
  transform: translateX(-50%);
  z-index: 1;
}

.leg {
  position: absolute;
  top: 0;
  width: 30%;
  height: 100%;
  border-radius: 3px 3px 2px 2px;
  background: linear-gradient(180deg, #1e293b 0 70%, #0f172a 70%);
  transition: transform 0.12s ease;
  transform-origin: top center;
  :root.dark & {
    background: linear-gradient(180deg, #334155 0 70%, #1e293b 70%);
  }
}
.leg-l {
  left: 12%;
}
.leg-r {
  right: 12%;
}

/* Speech bubble taunt — positioned in container space above keeper */
.keeper-taunt {
  position: absolute;
  z-index: 6;
  transform: translate(-50%, -100%);
  max-width: 120px;
  padding: 5px 9px;
  border-radius: 10px;
  font-size: 0.74rem;
  font-weight: 800;
  line-height: 1.25;
  white-space: nowrap;
  color: #0f172a;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--primary) 28%, transparent);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.14);
  animation: taunt-pop 1.1s ease-out forwards;
  direction: rtl;
  pointer-events: none;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border: 5px solid transparent;
    border-top-color: #fff;
  }

  :root.dark & {
    color: #f8fafc;
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.12);
    &::after {
      border-top-color: #1e293b;
    }
  }

  @media (max-width: 480px) {
    font-size: 0.66rem;
    padding: 4px 7px;
    max-width: 100px;
  }
}

@keyframes taunt-pop {
  0% {
    opacity: 0;
    transform: translate(-50%, -100%) scale(0.6) translateY(4px);
  }
  12% {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1.08) translateY(0);
  }
  22% {
    transform: translate(-50%, -100%) scale(1) translateY(0);
  }
  75% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -100%) scale(0.96) translateY(-3px);
  }
}

/* ── Ball ─────────────────────────────────────────── */
.ball {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38px;
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

  @media (max-width: 480px) {
    padding: 10px;
    :deep(p) {
      font-size: 0.85rem;
    }
  }
}

/* ── Score badges ─────────────────────────────────── */
.score-badges {
  position: absolute;
  top: 10px;
  inset-inline-start: 10px;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  pointer-events: none;
  @media (max-width: 480px) {
    top: 8px;
    inset-inline-start: 8px;
  }
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

/* ── Banners ──────────────────────────────────────── */
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
  animation: goal-pop 1.3s ease-out forwards;
  pointer-events: none;
  @media (max-width: 480px) {
    font-size: 0.95rem;
    top: 10px;
  }
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
    transform: translateY(240px) rotate(500deg);
    opacity: 0;
  }
}
</style>
