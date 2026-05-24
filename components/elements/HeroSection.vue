<template>
  <section class="hero-section" :class="customClass">
    <div class="cont">
      <div class="hero-content">
        <!-- Logo (optional) -->
        <h1 class="hero-title" v-if="title">
          <span>
            <NuxtImg
              format="webp"
              preload
              src="/uae-handbal-logo.png"
              alt="Nerva Logo"
              class="logo-img"
          /></span>
          <span>{{ title }}</span>
        </h1>

        <!-- Subtitle (optional) -->
        <p class="hero-subtitle" v-if="subtitle">
          {{ subtitle }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
// Props with defaults
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  subtitle: {
    type: String,
    default: "",
  },
});
</script>

<style lang="scss" scoped>
// Hero Section
.hero-section {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  padding: 160px 0 80px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d4af37' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.3;
  }

  .hero-content {
    text-align: center;
    position: relative;
    z-index: 2;
  }

  .hero-title {
    font-weight: 700;
    margin-bottom: 20px;
    background: linear-gradient($second 0%, #cfc177 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    img {
      filter: brightness(0) invert(1);
      opacity: 0.9;
      margin-inline-end: 10px;
      width: 60px;
      height: 30px;
    }
  }

  .hero-subtitle {
    font-size: 1.1rem;
    opacity: 0.9;
    font-weight: 300;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
}

.hero-content {
  position: relative;
  z-index: 2;

  .hero-title {
    font-size: 2.2rem;
    font-weight: 700;
    margin-bottom: 20px;

    // Gradient text for gradient background
    .hero-gradient & {
      background: linear-gradient($second 0%, #cfc177 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .logo-img {
      filter: brightness(0) invert(1);
      opacity: 0.9;
      margin-inline-end: 10px;

      // Adjust logo for light background
      .hero-light & {
        filter: none;
      }
    }
  }

  .hero-subtitle {
    font-size: 1.1rem;
    opacity: 0.9;
    font-weight: 300;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .hero-actions {
    margin-top: 30px;
  }
}

// Responsive Design
@media (max-width: 768px) {
  .hero-section {
    padding: 120px 0 60px;

    .hero-title {
      font-size: 2.5rem;
    }

    .hero-subtitle {
      font-size: 1rem;
    }
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 100px 0 40px;

    .hero-title {
      font-size: 2rem;

      .logo-img {
        width: 50px;
        height: 25px;
      }
    }
  }
}
</style>
