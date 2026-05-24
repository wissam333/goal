<template>
    <div
      class="pointer changelan"
      :class="$i18n.locale === 'ar' ? 'ar' : 'en'"
      @click.stop="toggleLang"
    >
      <Icon name="i-ph-translate-bold" size="22" />
      {{ $i18n.locale == "ar" ? "English" : "العربية" }}
    </div>
</template>

<script setup>
const { locale, setLocale } = useI18n();

const toggleLang = () => {
  const newLang = locale.value === "ar" ? "en" : "ar";
  setLocale(newLang);
};
</script>

<style lang="scss" scoped>
.changelan {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  color: #333;
  cursor: pointer;
  padding: 10px;
  border-radius: 6px;
  transition: all 0.3s ease;

  &:hover {
    color: var(--accent-color);
  }
  &.en {
    font-family: "Tajawal", "sans-serif";
  }
  &.ar {
    font-family: Tajawal, sans-serif;
  }
}
</style>
