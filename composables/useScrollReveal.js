// composables/useScrollReveal.js
import { useIntersectionObserver } from "@vueuse/core";

export const useScrollReveal = (threshold = 0.1) => {
  const target = ref(null);
  const isVisible = ref(false);

  onMounted(() => {
    // If already in viewport on load/refresh — show immediately
    if (target.value) {
      const rect = target.value.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        isVisible.value = true;
        return;
      }
    }

    // Not in viewport — observe for when user scrolls to it
    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          isVisible.value = true;
          stop();
        }
      },
      { threshold },
    );
  });

  return { target, isVisible };
};
