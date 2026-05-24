<template>
  <div
    class="marquee-container"
    :class="{ vertical: vertical }"
    @mouseover="pauseOnHover ? pauseThis($event) : null"
    @mouseleave="pauseOnHover ? resumeThis($event) : null"
  >
    <!-- Left vignette -->
    <div class="vignette left"></div>

    <!-- Marquee content -->
    <div
      v-for="index in repeat"
      :key="index"
      class="marquee-wrapper"
      :class="{ 'vertical-wrapper': vertical, 'horizontal-wrapper': !vertical }"
      :style="{ animationDirection: reverse ? 'reverse' : 'normal' }"
    >
      <slot />
    </div>

    <!-- Right vignette -->
    <div class="vignette right"></div>
  </div>
</template>

<script setup>
const props = defineProps({
  reverse: {
    type: Boolean,
    default: false,
  },
  pauseOnHover: {
    type: Boolean,
    default: false,
  },
  vertical: {
    type: Boolean,
    default: false,
  },
  repeat: {
    type: Number,
    default: 4,
  },
  duration: {
    type: String,
    default: "50s",
  },
  gap: {
    type: String,
    default: "0rem",
  },
});

const pauseOnHover = props.pauseOnHover;

const pauseThis = (e) => {
  const container = e.currentTarget;
  container.querySelectorAll(".marquee-wrapper").forEach((w) => {
    w.style.animationPlayState = "paused";
  });
};

const resumeThis = (e) => {
  const container = e.currentTarget;
  container.querySelectorAll(".marquee-wrapper").forEach((w) => {
    w.style.animationPlayState = "running";
  });
};
</script>

<style scoped>
.marquee-container {
  display: flex;
  overflow: hidden;
  padding: 0.5rem;
  gap: var(--gap, 0rem);
  --duration: 50s;
  --gap: 0rem;
  position: relative; /* required for absolute vignette */
}

.marquee-container.vertical {
  flex-direction: column;
}

.marquee-wrapper {
  display: flex;
  flex-shrink: 0;
  justify-content: space-around;
  gap: var(--gap, 1rem);
  animation-duration: var(--duration, 40s);
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.horizontal-wrapper {
  flex-direction: row;
  animation-name: marquee-horizontal;
}

.vertical-wrapper {
  flex-direction: column;
  animation-name: marquee-vertical;
}

@keyframes marquee-horizontal {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-100% - var(--gap)));
  }
}

@keyframes marquee-vertical {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(calc(-100% - var(--gap)));
  }
}

/* Vignette styles */
.vignette {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3rem; /* width of the shadow */
  pointer-events: none; /* allow clicks to pass through */
  z-index: 10;
}

.vignette.left {
  left: 0;
  background: linear-gradient(to right, var(--bg-page), transparent);
}

.vignette.right {
  right: 0;
  background: linear-gradient(to left, var(--bg-page), transparent);
}
</style>
