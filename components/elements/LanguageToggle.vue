<template>
  <button
    class="aesthetic-btn-icon"
    @click="toggleLang"
    title="Switch Language"
  >
    <Icon name="i-ph-translate-bold" size="22" />
    <span class="lang-indicator" :class="$i18n.locale === 'ar' ? 'ar' : 'en'">{{
      $i18n.locale === "ar" ? "English" : "العربية"
    }}</span>
  </button>
</template>

<script setup>
const { locale, setLocale } = useI18n();

const toggleLang = () => {
  const newLang = locale.value === "ar" ? "en" : "ar";
  setLocale(newLang);
};
</script>

<style lang="scss" scoped>
.lang-indicator {
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  &.en {
    font-family: "Tajawal", "sans-serif";
  }
  &.ar {
    font-family: Tajawal, sans-serif;
  }
}

.aesthetic-btn-icon {
  background: transparent;
  border: 1px solid transparent;
  color: #333; // Icon color
  /* Common styling for icon buttons */
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  &:hover {
    color: $main; // Green accent on hover
  }
}
.lang-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 0.5rem;
  font-weight: 900;
  background: var(--text-color);
  color: var(--card-bg); // Use card-bg for high contrast text on the indicator
  padding: 1px 3px;
  border-radius: 4px;
}
</style>
