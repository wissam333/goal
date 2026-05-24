<template>
  <header class="page-header" :class="noImg ? 'no-img' : ''">
    <div
      class="bg-image"
      :class="$i18n.locale === 'ar' ? 'ar' : ''"
      :style="{
        backgroundImage: `url(${bgImage})`,
      }"
    ></div>

    <div class="overlay"></div>

    <div class="container h-100 position-relative d-flex align-items-center">
      <h2 class="display-5 fw-bold text-white mb-0" data-aos="fade-right">
        {{ title }}
      </h2>
    </div>

    <div class="breadcrumb-tab" data-aos="fade-up">
      <div class="container">
        <div class="tab-content">
          <div class="icon-box">
            <Icon name="mdi:home-outline" />
          </div>
          <div class="links text-uppercase">
            <NuxtLink to="/" class="text-dark text-decoration-none">
              {{ homeLabel }}
            </NuxtLink>
            <span class="mx-2">/</span>
            <span class="current fw-bold">
              {{ currentLabel }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <div class="breadcrumb-strip" data-aos="fade-up">
    <div class="container">
      <div class="strip-content">
        <div class="icon-box">
          <Icon name="mdi:home-outline" />
        </div>

        <div class="links text-uppercase">
          <NuxtLink to="/" class="home-link">
            {{ homeLabel }}
          </NuxtLink>

          <span class="separator">
            <Icon name="mdi:chevron-right" v-if="$i18n.locale !== 'ar'" />
            <Icon name="mdi:chevron-left" v-else />
          </span>

          <span class="current">
            {{ currentLabel }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  bgImage: String,
  noImg: Boolean,
  homeLabel: {
    type: String,
    default: "Home",
  },
  currentLabel: String,
});
</script>

<style lang="scss" scoped>
.page-header {
  position: relative;
  aspect-ratio: 1600/400;
  overflow: hidden;
  margin-bottom: 0;
  display: flex;
  align-items: center;

  &.no-img {
    // Bold medical blue gradient
    background: linear-gradient(135deg, #b8d91a 0%, #99b318 100%);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.15;

      /* This SVG creates a staggered pattern (Hexagonal/Beehive style)
       We define two circles: one at the corner and one in the middle 
       to create the interlocking 'honeycomb' look.
    */
      background-image: url("data:image/svg+xml,%3Csvg width='40' height='68' viewBox='0 0 40 68' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='20' cy='0' r='18'/%3E%3Ccircle cx='20' cy='68' r='18'/%3E%3Ccircle cx='0' cy='34' r='18'/%3E%3Ccircle cx='40' cy='34' r='18'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      background-size: 40px 68px;
    }

    // Adding a subtle soft glow to the center to make the 'hive' look organic
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(
        circle at center,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 80%
      );
      pointer-events: none;
    }
  }
  .bg-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center top;
    z-index: 1;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.5) 0%,
      rgba(0, 0, 0, 0.2) 50%,
      rgba(0, 0, 0, 0.1) 100%
    );
    z-index: 2;
  }

  .container {
    z-index: 3;
    position: relative;

    h2 {
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      @media (max-width: 991px) {
        font-size: 1.3rem !important;
      }
    }
  }

  .breadcrumb-tab {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 4;
    @media (max-width: 991px) {
      display: none;
    }
    .tab-content {
      display: inline-flex;
      align-items: center;
      background: white;
      padding: 15px 30px 15px 20px;
      border-top-right-radius: 20px;
      border-top-left-radius: 20px;
      box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.1);
      gap: 15px;
      @media (max-width: 991px) {
        gap: 5px;
        padding: 8px 15px 8px 10px;
      }

      [dir="rtl"] & {
        border-top-right-radius: 0;
        border-top-left-radius: 20px;
      }

      .icon-box {
        background: $main;
        color: white;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        font-size: 1.2rem;
      }

      .links {
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 1px;
        color: #333;
        @media (max-width: 991px) {
          font-size: 0.6rem;
        }
      }
    }
  }
}

.breadcrumb-strip {
  display: none;
  @media (max-width: 991px) {
    display: block;
    background-color: #fff;
    border-bottom: 1px solid #eee;
    padding: 15px 0;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03); // Very subtle shadow
    position: relative;
    z-index: 10;

    .strip-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .icon-box {
      background: $main; // Assuming $main is defined globally or import it
      color: white;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px; // Softer corners
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .links {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #666;
      display: flex;
      align-items: center;
      flex-wrap: wrap;

      .home-link {
        color: #333;
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
          color: $main;
        }
      }

      .separator {
        margin: 0 2px;
        color: #ccc;
        display: flex;
        align-items: center;
        font-size: 1.1rem;
      }

      .current {
        color: $main; // Highlight current page
        font-weight: 700;
      }
    }
  }
}
</style>
