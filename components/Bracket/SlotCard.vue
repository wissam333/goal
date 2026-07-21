<template>
  <div
    class="ksc-wrap"
    :class="{
      'ksc-placeholder': isPlaceholder,
      'ksc-final': final,
      'ksc-clickable': !isPlaceholder,
    }"
    @click="isPlaceholder ? null : $emit('click')"
  >
    <span class="ksc-tag">{{ slotLabel }}</span>
    <template v-if="isPlaceholder">
      <div class="ksc-row ksc-ph">
        <span class="ksc-name ksc-name-ph">{{ homeLabel }}</span>
        <span class="ksc-chip ksc-chip-ph">&ndash;</span>
      </div>
      <div class="ksc-divider" />
      <div class="ksc-row ksc-ph">
        <span class="ksc-name ksc-name-ph">{{ awayLabel }}</span>
        <span class="ksc-chip ksc-chip-ph">&ndash;</span>
      </div>
    </template>
    <template v-else>
      <div class="ksc-row" :class="{ 'ksc-win': homeWinner }">
        <span class="ksc-name">{{ homeLabel }}</span>
        <span class="ksc-chip" :class="{ 'ksc-chip-win': homeWinner }">
          {{ openHome }}
        </span>
      </div>
      <div class="ksc-divider" />
      <div class="ksc-row" :class="{ 'ksc-win': awayWinner }">
        <span class="ksc-name">{{ awayLabel }}</span>
        <span class="ksc-chip" :class="{ 'ksc-chip-win': awayWinner }">
          {{ openAway }}
        </span>
      </div>
      <div v-if="extraBadge" class="ksc-extra">{{ extraBadge }}</div>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  slot: { type: Object, required: true },
  getTeamName: { type: Function, required: true },
  final: { type: Boolean, default: false },
})

defineEmits(['click'])

const { getOpenPlayScore, formatScoreParts, getWinnerSlug } = useMatchResult()

const slotLabel = computed(() => {
  const s = props.slot
  if (s.round === 'FINAL') return 'Final'
  return `${s.round}${(s.order ?? 0) + 1}`
})

const isPlaceholder = computed(() => !props.slot._match)

const homeLabel = computed(() => {
  const h = props.slot._home
  return h?.label || 'TBD'
})

const awayLabel = computed(() => {
  const a = props.slot._away
  return a?.label || 'TBD'
})

const match = computed(() => props.slot._match)

const open = computed(() => match.value ? getOpenPlayScore(match.value) : { home: null, away: null })
const openHome = computed(() => open.value.home != null ? open.value.home : '\u2013')
const openAway = computed(() => open.value.away != null ? open.value.away : '\u2013')

const homeWinner = computed(() => {
  if (!match.value || match.value.status !== 'played') return false
  return getWinnerSlug(match.value) === match.value.homeTeam
})

const awayWinner = computed(() => {
  if (!match.value || match.value.status !== 'played') return false
  return getWinnerSlug(match.value) === match.value.awayTeam
})

const extraBadge = computed(() => {
  if (!match.value) return ''
  const parts = formatScoreParts(match.value)
  if (parts.pens) return `${parts.pens} ${parts.badge}`
  if (parts.method === 'aet') return parts.badge
  return ''
})
</script>

<style lang="scss" scoped>
.ksc-wrap {
  position: relative;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 6px 10px;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.12s;
}
.ksc-tag {
  position: absolute;
  top: -8px;
  inset-inline-end: -6px;
  font-size: 0.6rem;
  font-weight: 700;
  background: var(--primary);
  color: #fff;
  padding: 1px 6px;
  border-radius: 6px;
  line-height: 1.4;
  z-index: 1;
}
.ksc-clickable {
  cursor: pointer;
  &:hover {
    border-color: var(--primary);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.09);
    transform: translateY(-1px);
  }
  &:active { transform: scale(0.98); }
}
.ksc-final {
  border-color: rgba(234, 179, 8, 0.35);
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.06), transparent);
  &:hover { border-color: #ca8a04; }
}
.ksc-placeholder {
  border-style: dashed;
  border-color: var(--border-color);
}
.ksc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 4px;
  border-radius: 7px;
  transition: background 0.12s;
  &.ksc-win { background: var(--primary-soft); }
}
.ksc-ph {
  opacity: 0.85;
}
.ksc-name {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ksc-name-ph {
  color: var(--text-muted);
  font-style: italic;
}
.ksc-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border-radius: 7px;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--text-muted);
  background: var(--bg-elevated);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  &.ksc-chip-win {
    color: #fff;
    background: var(--primary);
  }
}
.ksc-chip-ph {
  color: var(--text-muted);
  opacity: 0.5;
}
.ksc-divider {
  height: 1px;
  background: var(--border-color);
  margin: 3px 0;
}
.ksc-extra {
  margin-top: 4px;
  text-align: center;
  font-size: 0.65rem;
  font-weight: 800;
  color: #ca8a04;
  letter-spacing: 0.2px;
}
@media (max-width: 520px) {
  .ksc-wrap { padding: 4px 7px; }
  .ksc-name { font-size: 0.7rem; }
  .ksc-chip { min-width: 24px; height: 24px; font-size: 0.72rem; }
  .ksc-row { padding: 3px 2px; gap: 4px; }
  .ksc-divider { margin: 1px 0; }
}
</style>
