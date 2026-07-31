<template>
  <div class="draw-editor">
    <div class="draw-toggle-row">
      <label class="draw-toggle">
        <input type="checkbox" :checked="draw.published" @change="togglePublish" />
        <span>عرض المخطط في الصفحة الرئيسية</span>
      </label>
    </div>

    <div class="draw-rounds">
      <div v-for="round in roundKeys" :key="round" class="draw-round">
        <div class="draw-round-title">{{ roundLabel(round) }}</div>

        <div v-for="(slot, si) in roundSlots(round)" :key="slot._key" class="draw-slot">
          <div class="draw-slot-header">
            <span class="draw-slot-num">المباراة {{ si + 1 }}</span>
            <button class="draw-slot-remove" @click="removeSlot(slot._key)" type="button">حذف</button>
          </div>

          <div class="draw-slot-sides">
            <div class="draw-side">
              <span class="draw-side-label">الفريق الأول</span>
              <AdminDrawSideType :side="slot.home" :groups="groups" :teams="teams" :winner-slots="winnerOptionsFor(slot.round)" @update="v => updateSide(slot._key, 'home', v)" />
            </div>
            <div class="draw-side">
              <span class="draw-side-label">الفريق الثاني</span>
              <AdminDrawSideType :side="slot.away" :groups="groups" :teams="teams" :winner-slots="winnerOptionsFor(slot.round)" @update="v => updateSide(slot._key, 'away', v)" />
            </div>
          </div>
        </div>

        <button class="draw-add-slot" @click="addSlot(round)" type="button">
          + إضافة مباراة
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const { t } = useI18n()
const props = defineProps({
  modelValue: { type: Object, default: () => ({ published: false, slots: [] }) },
  groups: { type: Array, default: () => ['A', 'B'] },
  teams: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const draw = computed(() => props.modelValue)

function emitUpdate(v) {
  emit('update:modelValue', { ...draw.value, ...v })
}

function togglePublish(e) {
  emitUpdate({ published: e.target.checked })
}

const roundKeys = ['R16', 'QF', 'SF', 'FINAL']

const ROUND_ORDER = { R16: 0, QF: 1, SF: 2, FINAL: 3 }

function roundLabel(key) {
  return key === 'R16' ? 'دور الـ 16' : key === 'QF' ? 'ربع النهائي' : key === 'SF' ? 'نصف النهائي' : 'النهائي'
}

function roundSlots(round) {
  return (draw.value.slots || []).filter(s => s.round === round).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

let _keyCounter = 0

function addSlot(round) {
  const slots = [...(draw.value.slots || [])]
  const existing = slots.filter(s => s.round === round)
  const order = existing.length
  slots.push({
    _key: `s-${Date.now()}-${++_keyCounter}`,
    id: `${round.toLowerCase()}-${order + 1}`,
    round,
    order,
    home: { type: 'tbd' },
    away: { type: 'tbd' },
  })
  emitUpdate({ slots })
}

function removeSlot(key) {
  const slots = (draw.value.slots || []).filter(s => s._key !== key)
  emitUpdate({ slots })
}

const winnerSlotOptions = computed(() =>
  (draw.value.slots || []).map(s => ({
    id: s.id,
    _key: s._key,
    round: s.round,
    home: s.home,
    away: s.away,
  }))
)

// ponytail: a match can only feed a LATER round — filtering by round kills all cycles by construction
function winnerOptionsFor(round) {
  const cur = ROUND_ORDER[round] ?? 99
  return winnerSlotOptions.value.filter(s => (ROUND_ORDER[s.round] ?? -1) < cur)
}

function updateSide(slotKey, side, value) {
  const slots = (draw.value.slots || []).map(s => {
    if (s._key !== slotKey) return s
    return { ...s, [side]: value }
  })
  emitUpdate({ slots })
}
</script>

<style lang="scss" scoped>
.draw-editor { display: flex; flex-direction: column; gap: 16px; }
.draw-toggle-row { display: flex; }
.draw-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; }
.draw-rounds { display: flex; flex-direction: column; gap: 20px; }
.draw-round { background: var(--bg-elevated); border-radius: 12px; padding: 16px; }
.draw-round-title { font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-bottom: 12px; }
.draw-slot { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; margin-bottom: 10px; }
.draw-slot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.draw-slot-num { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
.draw-slot-remove { background: none; border: 1px solid #ef4444; color: #ef4444; border-radius: 6px; padding: 4px 10px; font-size: 0.75rem; cursor: pointer; }
.draw-slot-sides { display: flex; gap: 12px; @media (max-width: 640px) { flex-direction: column; } }
.draw-side { flex: 1; }
.draw-side-label { display: block; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px; }
.draw-add-slot { background: none; border: 1px dashed var(--border-color); border-radius: 8px; padding: 8px; color: var(--primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; width: 100%; }
.draw-add-slot:hover { border-color: var(--primary); background: var(--primary-soft); }
</style>
