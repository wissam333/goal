<template>
  <div class="page-header" :class="{ 'has-back': showBack }">
    <!-- Left: back btn + title block -->
    <div class="ph-left">
      <button v-if="showBack" class="ph-back-btn" @click="handleBack">
        <Icon :name="isRtl ? 'mdi:arrow-right' : 'mdi:arrow-left'" size="18" />
      </button>

      <div class="ph-title-block">
        <div class="ph-title-row">
          <div v-if="icon" class="ph-icon">
            <Icon :name="icon" size="20" />
          </div>
          <h1 class="ph-title">{{ title }}</h1>
          <slot name="badge" />
        </div>
        <p v-if="subtitle" class="ph-subtitle">{{ subtitle }}</p>
      </div>
    </div>

    <!-- Right: action buttons -->
    <div v-if="$slots.actions || actions.length" class="ph-actions">
      <template v-for="(action, i) in actions" :key="i">
        <SharedUiButtonBase
          v-if="!action.hidden"
          :id="action.id || undefined"
          :variant="action.variant || 'outline'"
          :icon-left="action.icon"
          :loading="action.loading"
          :disabled="action.disabled"
          @click="$emit('action-click', action)"
        >
          {{ action.label }}
        </SharedUiButtonBase>
      </template>

      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  icon: { type: String, default: "" },
  showBack: { type: Boolean, default: false },
  backTo: { type: String, default: "" },
  isRtl: { type: Boolean, default: false },
  actions: { type: Array, default: () => [] },
});

const emit = defineEmits(["back", "action-click"]);
const router = useRouter();

const handleBack = () => {
  emit("back");
  if (props.backTo) router.push(props.backTo);
  else router.back();
};
</script>

<style lang="scss" scoped>
// ── Base ──────────────────────────────────────────────────────────────────────
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 24px;
  flex-shrink: 0;
}

// ── Left side ─────────────────────────────────────────────────────────────────
.ph-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0; // allow flex child to shrink below content size
}

.ph-back-btn {
  // Fixed size — never shrinks or grows
  width: 36px;
  height: 36px;
  min-width: 36px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-sub);
  flex-shrink: 0;
  margin-top: 2px;
  transition:
    border-color 0.18s,
    color 0.18s,
    background 0.18s;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: var(--primary-soft);
  }

  &:active {
    transform: scale(0.93);
  }
}

.ph-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0; // allow text to truncate
  flex: 1;
}

.ph-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.ph-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ph-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
  line-height: 1.25;
  // Allow wrapping on mobile — no more clipped titles
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
  min-width: 0;
}

.ph-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.45;
  // Subtitles can wrap naturally
  white-space: normal;
  overflow-wrap: break-word;
}

// ── Right side ────────────────────────────────────────────────────────────────
.ph-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
  // Align to the top of the header, matching title baseline
  align-self: flex-start;
}

// ── Tablet (max 768px) ────────────────────────────────────────────────────────
@media (max-width: 768px) {
  .page-header {
    gap: 10px;
    padding-bottom: 16px;
    margin-bottom: 20px;
  }

  .ph-title {
    font-size: 1.4rem;
  }
}

// ── Mobile (max 576px) ────────────────────────────────────────────────────────
@media (max-width: 576px) {
  .page-header {
    // Stack into two rows: [back + title] then [actions]
    flex-direction: column;
    gap: 12px;
    padding-bottom: 14px;
    margin-bottom: 18px;
  }

  .ph-left {
    // Back button stays vertically centered to the first line of text
    align-items: flex-start;
    gap: 10px;
    width: 100%;
  }

  .ph-back-btn {
    // Slightly smaller touch target on very narrow screens
    width: 34px;
    height: 34px;
    min-width: 34px;
    // Nudge up to optically align with title text cap-height
    margin-top: 3px;
  }

  .ph-icon {
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 8px;
  }

  .ph-title {
    font-size: 1.25rem;
    // Ensure long titles always wrap rather than overflow
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }

  .ph-subtitle {
    font-size: 0.8125rem;
  }

  .ph-actions {
    // Full width, buttons hug the right edge
    width: 100%;
    justify-content: flex-end;
    // Remove top-alignment override — actions sit naturally in column flow
    align-self: auto;
  }
}

// ── Extra-small (max 380px) ───────────────────────────────────────────────────
@media (max-width: 380px) {
  .ph-actions {
    // On very narrow phones, let buttons fill available width
    justify-content: stretch;

    // Stretch slotted / declarative buttons to full width
    :deep(.btn),
    :deep([class*="button"]) {
      flex: 1;
      justify-content: center;
    }
  }

  .ph-title {
    font-size: 1.15rem;
  }
}
</style>
