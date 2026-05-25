<template>
  <div class="kmc-wrap" :class="{ 'kmc-final': final }">
    <div class="kmc-row" :class="{ 'kmc-win': isWinner(match, match.homeTeam) }">
      <span class="kmc-name">{{ getTeamName(match.homeTeam) }}</span>
      <span class="kmc-chip" :class="{ 'kmc-chip-win': isWinner(match, match.homeTeam) }">
        {{ match.homeScore ?? '–' }}
      </span>
    </div>
    <div class="kmc-divider" />
    <div class="kmc-row" :class="{ 'kmc-win': isWinner(match, match.awayTeam) }">
      <span class="kmc-name">{{ getTeamName(match.awayTeam) }}</span>
      <span class="kmc-chip" :class="{ 'kmc-chip-win': isWinner(match, match.awayTeam) }">
        {{ match.awayScore ?? '–' }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  match:       { type: Object,   required: true },
  getTeamName: { type: Function, required: true },
  isWinner:    { type: Function, required: true },
  final:       { type: Boolean,  default: false },
});
</script>

<style lang="scss" scoped>
.kmc-wrap {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 6px 10px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.12s;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.09);
    transform: translateY(-1px);
  }
  &:active { transform: scale(0.98); }
}

.kmc-final {
  border-color: rgba(234, 179, 8, 0.35);
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.06), transparent);
  &:hover { border-color: #ca8a04; }
}

.kmc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 4px;
  border-radius: 7px;
  transition: background 0.12s;

  &.kmc-win { background: var(--primary-soft); }
}

.kmc-name {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  // In RTL the name starts from the right — text-align handles this
  // automatically via the inherited dir attribute, nothing extra needed.
}

.kmc-chip {
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
  // Score chip always stays on the trailing edge (right in LTR, left in RTL)
  // because it's the last child in the flex row — flex naturally handles this.

  &.kmc-chip-win {
    color: #fff;
    background: var(--primary);
  }
}

.kmc-divider {
  height: 1px;
  background: var(--border-color);
  margin: 3px 0;
}
</style>