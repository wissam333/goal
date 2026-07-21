<template>
  <div v-if="rounds.length" class="knockout-bracket" :class="{ 'is-rtl': isRtl }">
    <template v-for="(round, ri) in rounds" :key="round.key">
      <div v-if="ri > 0 && rounds[ri - 1].slots.length && round.slots.length" class="kt-connector-col">
        <BracketConnectorLines :from="rounds[ri - 1].slots.length" :to="round.slots.length" :winners="rounds[ri - 1].slots.map(s => !!s._match && s._match.status === 'played' && s._home?.resolved && s._away?.resolved)" />
      </div>
      <div class="kt-stage" :class="{ 'kt-stage-final': round.key === 'FINAL' }">
        <div class="kt-stage-label" :class="{ 'kt-stage-label-final': round.key === 'FINAL' }">
          <Icon v-if="round.key === 'FINAL'" name="mdi:trophy" size="14" />
          {{ stageLabel(round.key) }}
        </div>
        <div class="kt-cards">
          <BracketSlotCard
            v-for="slot in round.slots"
            :key="slot.id"
            :slot="slot"
            :get-team-name="getTeamName"
            :final="round.key === 'FINAL'"
            @click="onSlotClick(slot)"
          />
        </div>
      </div>
    </template>
  </div>
  <SharedUiFeedbackEmptyState v-else :title="emptyTitle" icon="mdi:tournament" />
</template>

<script setup>
const { t, locale } = useI18n()

const props = defineProps({
  rounds: { type: Array, required: true },
  getTeamName: { type: Function, required: true },
  emptyTitle: { type: String, default: '' },
  leaguePath: { type: Function, default: null },
})

const isRtl = computed(() => locale.value === 'ar')

const stageLabels = {
  QF: 'bracket.quarterfinal',
  SF: 'bracket.semifinal',
  FINAL: 'bracket.final',
}

function stageLabel(key) {
  const labelKey = stageLabels[key]
  return labelKey ? t(labelKey) : key
}

function onSlotClick(slot) {
  if (!slot._match) return
  if (props.leaguePath) {
    navigateTo(props.leaguePath(`/matches/${slot._match.slug}`))
  }
}
</script>

<style lang="scss" scoped>
.knockout-bracket {
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  padding: 24px 4px;
  -webkit-overflow-scrolling: touch;
  min-height: 320px;
  scrollbar-width: thin;
  &.is-rtl { flex-direction: row-reverse; }
}
.kt-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  min-width: 160px;
  max-width: 200px;
  @media (max-width: 520px) {
    min-width: 130px;
    max-width: 150px;
  }
}
.kt-stage-label {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 14px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 5px;
  @media (max-width: 520px) {
    font-size: 0.58rem;
    margin-bottom: 10px;
  }
}
.kt-stage-label-final { color: #ca8a04; font-size: 0.76rem; }
.kt-cards {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  flex: 1;
  gap: 16px;
  width: 100%;
  @media (max-width: 520px) { gap: 10px; }
}
.kt-connector-col {
  display: flex;
  align-items: stretch;
  justify-content: center;
  flex-shrink: 0;
  width: 48px;
  padding-top: 36px;
  @media (max-width: 520px) {
    width: 28px;
    padding-top: 28px;
  }
}
</style>
