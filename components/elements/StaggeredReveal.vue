<script setup>
// This is the StaggeredReveal component - can be in same file or imported
import { ref, onMounted, watch, nextTick } from 'vue';

const props = defineProps({
  duration: {
    type: Number,
    default: 1
  },
  delay: {
    type: Number,
    default: 0.2
  },
  blur: {
    type: String,
    default: '20px'
  },
  yOffset: {
    type: Number,
    default: 30
  },
  xOffset: {
    type: Number,
    default: 0
  },
  staggerChildren: {
    type: Boolean,
    default: true
  },
  threshold: {
    type: Number,
    default: 0.1
  }
});

const emit = defineEmits(['reveal-start', 'reveal-complete']);

const container = ref(null);
const children = ref([]);
const isInView = ref(false);

const getInitialStyle = (index = 0) => {
  const delay = props.staggerChildren ? index * props.delay : 0;
  return {
    '--reveal-duration': `${props.duration}s`,
    '--reveal-delay': `${delay}s`,
    '--reveal-blur': props.blur,
    '--reveal-y': `${props.yOffset}px`,
    '--reveal-x': `${props.xOffset}px`,
  };
};

const startAnimation = () => {
  if (isInView.value) return;
  
  isInView.value = true;
  emit('reveal-start');
  
  // Set animation styles on children
  nextTick(() => {
    const childElements = container.value?.children;
    if (childElements) {
      children.value = Array.from(childElements);
      
      children.value.forEach((child, index) => {
        const style = getInitialStyle(index);
        Object.assign(child.style, {
          animationDuration: style['--reveal-duration'],
          animationDelay: style['--reveal-delay'],
          opacity: '0',
          filter: `blur(${style['--reveal-blur']})`,
          transform: `translate(${style['--reveal-x']}, ${style['--reveal-y']})`,
        });
        
        // Add animation class
        child.classList.add('reveal-animate');
        
        // Listen for animation end
        child.addEventListener('animationend', () => {
          if (index === children.value.length - 1) {
            emit('reveal-complete');
          }
        }, { once: true });
      });
    }
  });
};

const observer = ref(null);

onMounted(() => {
  if (!container.value) return;
  
  // Create Intersection Observer
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startAnimation();
          observer.value?.unobserve(entry.target);
        }
      });
    },
    {
      threshold: props.threshold,
      rootMargin: '50px'
    }
  );
  
  observer.value.observe(container.value);
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});
</script>

<template>
  <div 
    ref="container" 
    class="staggered-reveal-container"
    :class="{ 'in-view': isInView }"
  >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.home {
  position: relative;

  .slider-content {
    position: relative;
    width: 100%;
    height: 100%;
  }

  /* --- Swiper Customization --- */
  .custom-swiper {
    width: 100%;
    height: 100%;
    --swiper-pagination-color: #69acdf;
    --swiper-pagination-bullet-inactive-color: #ffffff;
    --swiper-pagination-bullet-inactive-opacity: 0.6;
    --swiper-pagination-bullet-size: 10px;
    --swiper-pagination-bullet-horizontal-gap: 6px;
    
    --swiper-pagination-bottom: 40px;

    &::part(pagination) {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    &::part(bullet) {
      transition: all 0.3s ease;
      border-radius: 10px;
    }

    &::part(bullet-active) {
      width: 24px;
      border-radius: 10px;
    }
  }

  .hero-overlay {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    text-align: center;
    color: #ffffff;
    width: 90%;
    pointer-events: none;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);

    .text-content {
      pointer-events: auto;
    }
    
    &.slide-changed {
      .reveal-animate {
        animation-name: reveal-fade-slide-up, reveal-deblur;
      }
    }
  }

  /* Language Toggle Button */
  .language-toggle {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.9rem;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    pointer-events: auto;
    z-index: 20;
    
    &:hover {
      background: rgba(0, 0, 0, 0.7);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-2px);
    }
    
    &:active {
      transform: translateY(0);
    }
  }

  /* Base text styles */
  .hero-title {
    font-size: 3rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0;
    line-height: 1.2;
    
    &.english-text {
      letter-spacing: 2px;
    }
    
    &.arabic-text {
      letter-spacing: 0;
      text-transform: none;
      font-weight: 600;
    }
  }

  .hero-subtitle {
    font-size: 1.2rem;
    font-weight: 400;
    margin-top: 10px;
    
    &.english-subtitle {
      letter-spacing: 0.5px;
    }
    
    &.arabic-subtitle {
      letter-spacing: 0;
      font-weight: 400;
    }
  }

  /* Staggered Reveal Container Styles */
  .staggered-reveal-container {
    .hero-title,
    .hero-subtitle {
      opacity: 0;
      filter: blur(var(--reveal-blur, 20px));
      transform: translate(var(--reveal-x, 0), var(--reveal-y, 30px));
      animation-fill-mode: forwards;
      
      &.reveal-animate {
        animation-name: reveal-fade-slide-up, reveal-deblur;
        animation-duration: var(--reveal-duration, 1s);
        animation-delay: var(--reveal-delay, 0s);
        animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1);
        animation-fill-mode: forwards;
      }
    }
    
    &.in-view {
      /* Container is in view */
    }
  }

  /* Animation Keyframes */
  @keyframes reveal-fade-slide-up {
    0% {
      opacity: 0;
      transform: translate(var(--reveal-x, 0), var(--reveal-y, 30px));
    }
    100% {
      opacity: 1;
      transform: translate(0, 0);
    }
  }

  @keyframes reveal-deblur {
    0% {
      filter: blur(var(--reveal-blur, 20px));
    }
    100% {
      filter: blur(0);
    }
  }

  /* Special animations for Arabic */
  .arabic-text.reveal-animate {
    animation-name: reveal-fade-slide-up-arabic, reveal-deblur;
  }

  @keyframes reveal-fade-slide-up-arabic {
    0% {
      opacity: 0;
      transform: translate(var(--reveal-x, -20px), var(--reveal-y, -30px));
    }
    100% {
      opacity: 1;
      transform: translate(0, 0);
    }
  }

  /* Slider Wrapper */
  .image-wrapper {
    width: 100%;
    height: 90vh;
    max-height: 90vh;
    aspect-ratio: 21 / 9;
    position: relative;
    overflow: hidden;
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .image-wrapper {
      height: 55vh;
      max-height: 55vh;
      aspect-ratio: 16 / 9;
    }
    
    .hero-overlay {
      bottom: 70px;
      .hero-title {
        font-size: 1.8rem;
      }
      .hero-subtitle {
        font-size: 0.9rem;
      }
      
      .language-toggle {
        top: 10px;
        right: 10px;
        padding: 6px 12px;
        font-size: 0.8rem;
      }
    }
  }

  /* Adjust animation for mobile */
  @media (max-width: 768px) {
    .staggered-reveal-container {
      .hero-title,
      .hero-subtitle {
        --reveal-blur: 10px;
        --reveal-y: 20px;
        
        &.arabic-text,
        &.arabic-subtitle {
          --reveal-x: -10px;
          --reveal-y: -20px;
        }
      }
    }
  }

  .image-rendered {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  
  .fade-in { opacity: 1; }

  .skeleton-item {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, #d1d1d1 0%, #e8e8e8 20%, #d1d1d1 40%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite linear;
    transition: opacity 0.4s ease;
    z-index: 2;
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .image-wrapper .fade-in + .skeleton-item {
    opacity: 0;
    pointer-events: none;
  }
}
</style>