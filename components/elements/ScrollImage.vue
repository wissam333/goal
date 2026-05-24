<template>
    <div ref="imageContainer" class="scroll-image">
        <NuxtImg :src="src" :alt="alt" class="image" :placeholder="[50, 25, 80, 3]"
        format="webp" />
    </div>
</template>

<script setup>
// Props to allow dynamic image inputs
const props = defineProps({
    src: String,
    alt: String,
});

const imageContainer = ref(null);

const handleScroll = () => {
    if (imageContainer.value) {
        const scrollPosition = window.scrollY;
        const offsetTop = imageContainer.value.offsetTop;
        const windowHeight = window.innerHeight;

        if (
        scrollPosition + windowHeight > offsetTop &&
        scrollPosition < offsetTop + imageContainer.value.clientHeight
        ) {
        // Calculate how much to move the image based on scroll
        const moveAmount = (scrollPosition - offsetTop) * 0.4;
        imageContainer.value.style.transform = `translateY(${moveAmount}px)`;
        }
    }
};

onMounted(() => {
    window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped lang="scss">
.scroll-image {
  overflow: hidden;
  position: relative;
  height: 800px; /* Adjust as needed */
  @media (max-width: 991px) {
    min-height: auto !important;
  }
}

.image {
  width: 100%;
  height: 100%;
  min-height: 800px;
  object-fit: cover;
  transition: transform 0.2s ease-in-out;
  @media (max-width: 991px) {
    min-height: auto !important;
  }
}
</style>
