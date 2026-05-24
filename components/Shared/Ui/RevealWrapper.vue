<template>
  <div
    ref="target"
    class="v-hide-fade-up"
    :class="[`v-delay-${clampedDelay}`, { 'v-show-reveal': isVisible }]"
  >
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  index: {
    type: Number,
    default: 0,
  },
});

const { target, isVisible } = useScrollReveal(0.15);

// Map index to available v-delay-1 … v-delay-10 classes
const clampedDelay = computed(() => Math.min(props.index + 1, 10));
</script>
