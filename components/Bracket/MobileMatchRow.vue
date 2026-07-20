<template>
  <div class="mmr-wrap" :class="{ 'mmr-final': final }">
    <!-- Home: name outer edge, score toward center -->
    <div
      class="mmr-team"
      :class="[isRtl ? 'mmr-home-rtl' : 'mmr-home-ltr', { 'mmr-win': isWinner(match, match.homeTeam) }]"
    >
      <span class="mmr-name">{{ getTeamName(match.homeTeam) }}</span>
      <span class="mmr-score" :class="{ 'mmr-score-win': isWinner(match, match.homeTeam) }">
        {{ openHome }}
      </span>
    </div>

    <div class="mmr-vs">
      <span>VS</span>
      <span v-if="parts.pens || parts.method === 'aet'" class="mmr-extra">
        {{ parts.pens ? `${parts.pens} ${parts.badge}` : parts.badge }}
      </span>
    </div>

    <!-- Away: score toward center, name outer edge -->
    <div
      class="mmr-team"
      :class="[isRtl ? 'mmr-away-rtl' : 'mmr-away-ltr', { 'mmr-win': isWinner(match, match.awayTeam) }]"
    >
      <span class="mmr-score" :class="{ 'mmr-score-win': isWinner(match, match.awayTeam) }">
        {{ openAway }}
      </span>
      <span class="mmr-name">{{ getTeamName(match.awayTeam) }}</span>
    </div>
  </div>
</template>

<script setup>
const { locale } = useI18n();
const isRtl = computed(() => locale.value === 'ar');

const props = defineProps({
  match:       { type: Object,   required: true },
  getTeamName: { type: Function, required: true },
  isWinner:    { type: Function, required: true },
  final:       { type: Boolean,  default: false },
});

const { getOpenPlayScore, formatScoreParts } = useMatchResult();
const open = computed(() => getOpenPlayScore(props.match));
const openHome = computed(() => open.value.home ?? '–');
const openAway = computed(() => open.value.away ?? '–');
const parts = computed(() => formatScoreParts(props.match));
</script>

<style lang="scss" scoped>
.mmr-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 10px 14px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.12s, transform 0.12s;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  }
  &:active { transform: scale(0.985); }
}

.mmr-final {
  border-color: rgba(234, 179, 8, 0.3);
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.05), transparent);
}

.mmr-team {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;

  &.mmr-win .mmr-name {
    color: var(--primary);
    font-weight: 700;
  }
}

// LTR: home → name then score (score faces center)
.mmr-home-ltr { flex-direction: row; }
// LTR: away → score then name (score faces center)
.mmr-away-ltr { flex-direction: row-reverse; }

// RTL: home → score then name (score still faces center, name on right edge)
.mmr-home-rtl { flex-direction: row-reverse; }
// RTL: away → name then score (score still faces center, name on left edge)
.mmr-away-rtl { flex-direction: row; }

.mmr-name {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mmr-score {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--text-muted);
  background: var(--bg-elevated);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;

  &.mmr-score-win {
    color: #fff;
    background: var(--primary);
  }
}

.mmr-vs {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  flex-shrink: 0;
  min-width: 36px;
  text-align: center;
}

.mmr-extra {
  font-size: 0.58rem;
  color: #ca8a04;
  text-transform: none;
  white-space: nowrap;
}
</style>