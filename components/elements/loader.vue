<template>
  <div>
    <ClientOnly>
      <div class="triathlon-loader">
        <div id="preloader" :class="data.show ? 'show' : 'hide'">
          <div id="preloaders" class="loader-content">
            <!-- Logo with pulse animation -->
            <div class="logo-container">
              <Icon name="game-icons:soccer-ball" class="logo-pulse" />
            </div>

            <!-- Progress indicator -->
            <div class="progress-container">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: data.percent + '%' }"
                ></div>
              </div>
              <div class="progress-text">
                {{ Math.min(100, Math.floor(data.percent)) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup>
const props = defineProps({
  throttle: {
    type: Number,
    default: 200,
  },
  duration: {
    type: Number,
    default: 2000,
  },
  height: {
    type: Number,
    default: 3,
  },
});

// Options & Data
const data = reactive({
  percent: 0,
  show: false,
  canSucceed: true,
});

let messageInterval = null;
let _timer = null;
let _throttle = null;
let _cut;

// Functions
const clear = () => {
  _timer && clearInterval(_timer);
  _throttle && clearTimeout(_throttle);
  messageInterval && clearInterval(messageInterval);
  _timer = null;
};

const start = () => {
  clear();
  data.percent = 0;
  data.canSucceed = true;

  if (props.throttle) {
    _throttle = setTimeout(startTimer, props.throttle);
  } else {
    startTimer();
  }
};

const set = (num) => {
  data.show = true;
  data.canSucceed = true;
  data.percent = Math.min(100, Math.max(0, Math.floor(num)));
};

const increase = (num) => {
  data.percent = Math.min(100, Math.floor(data.percent + num));
};

const decrease = (num) => {
  data.percent = Math.max(0, Math.floor(data.percent - num));
};

const pause = () => clearInterval(_timer);
const resume = () => startTimer();

const finish = () => {
  data.percent = 100;
  // Clear message interval when finishing
  messageInterval && clearInterval(messageInterval);
  hide();
};

const hide = () => {
  clear();
  setTimeout(() => {
    data.show = false;
  }, 500);
};

const onLeaveComplete = () => {
  data.percent = 0;
};

const startTimer = () => {
  data.show = true;
  _cut = 10000 / Math.floor(props.duration);
  _timer = setInterval(() => {
    increase(_cut);
  }, 100);
};

// Hooks
const nuxtApp = useNuxtApp();
nuxtApp.hook("page:start", start);
nuxtApp.hook("page:finish", finish);

onBeforeUnmount(() => clear);
</script>

<style lang="scss" scoped>
.triathlon-loader {
  .hide {
    transform: translateY(-100%);
  }

  #preloader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    z-index: 99999;
    background: var(--bg-page);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.8s cubic-bezier(0.55, 0.09, 0.76, 0.76);
    transform: translateY(-100%);
    overflow: hidden;

    &.show {
      transform: translateY(0%);
      transition: none;
    }
    &.hide {
      transform: translateY(-100%);
    }
  }

  .loader-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
    width: 100%;
    max-width: 450px;
    padding: 2rem;
    position: relative;
    z-index: 10;
  }

  .logo-container {
    position: relative;
    margin-bottom: 1rem;
    padding: 1rem;
  }

  .logo-pulse {
    width: 72px;
    height: 72px;
    color: var(--primary);

    @media (max-width: 991px) {
      width: 48px;
      height: 48px;
    }
  }

  @media (max-width: 768px) {
    .loader-content {
      max-width: 320px;
      gap: 2rem;
      padding: 1.5rem;
    }
    .progress-container {
      width: 300px;
    }

  }
}
.progress-container {
  width: min(400px, 90vw);
  text-align: center;

  margin-top: 2rem;
  margin-bottom: 2rem;
  .progress-bar {
    height: 4px;
    background: var(--border-color);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.75rem;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, #000) 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
      box-shadow: 0 0 10px color-mix(in srgb, var(--primary) 0.3, transparent);
    }
  }

  .progress-text {
    color: var(--text-muted);
    font-size: 0.875rem;
    font-weight: 500;
  }
}
</style>
