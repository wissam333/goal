<template>
  <div class="dst-wrap">
    <SharedUiFormBaseSelect
      :model-value="side.type"
      :options="typeOptions"
      placeholder="النوع"
      size="sm"
      @update:model-value="onTypeChange"
    />

    <div v-if="side.type === 'seed'" class="dst-fields">
      <SharedUiFormBaseSelect
        :model-value="side.group"
        :options="groupOptions"
        placeholder="المجموعة"
        size="sm"
        @update:model-value="v => emitUpdate({ group: v })"
      />
      <SharedUiFormBaseSelect
        :model-value="side.pos"
        :options="posOptions"
        placeholder="الترتيب"
        size="sm"
        @update:model-value="v => emitUpdate({ pos: Number(v) })"
      />
    </div>

    <div v-if="side.type === 'winner'" class="dst-fields">
      <SharedUiFormBaseSelect
        :model-value="side.of"
        :options="winnerOptions"
        placeholder="اختر المباراة"
        size="sm"
        @update:model-value="v => emitUpdate({ of: v })"
      />
    </div>

    <div v-if="side.type === 'team'" class="dst-fields">
      <SharedUiFormBaseSelect
        :model-value="side.slug"
        :options="teamOptions"
        placeholder="اختر الفريق"
        size="sm"
        @update:model-value="v => emitUpdate({ slug: v })"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  side: { type: Object, default: () => ({ type: 'tbd' }) },
  groups: { type: Array, default: () => ['A', 'B'] },
  teams: { type: Array, default: () => [] },
  winnerSlots: { type: Array, default: () => [] },
})
const emit = defineEmits(['update'])

const typeOptions = [
  { label: 'TBD', value: 'tbd' },
  { label: 'تصنيف (متقدم من المجموعة)', value: 'seed' },
  { label: 'فائز من مباراة سابقة', value: 'winner' },
  { label: 'فريق محدد', value: 'team' },
]

const groupOptions = computed(() =>
  props.groups.map(g => ({ label: `المجموعة ${g}`, value: g }))
)

const posOptions = [
  { label: 'الأول', value: 1 },
  { label: 'الثاني', value: 2 },
  { label: 'الثالث', value: 3 },
  { label: 'الرابع', value: 4 },
]

const teamOptions = computed(() =>
  props.teams.map(t => ({ label: t.title, value: t.slug }))
)

const winnerOptions = computed(() =>
  props.winnerSlots.map(s => ({
    label: winnerSlotLabel(s),
    value: s.id,
  }))
)

function onTypeChange(type) {
  const base = { type }
  if (type === 'seed') { base.group = props.groups[0] || 'A'; base.pos = 1 }
  if (type === 'winner') base.of = ''
  if (type === 'team') base.slug = ''
  emit('update', base)
}

function emitUpdate(partial) {
  emit('update', { ...props.side, ...partial })
}

function winnerSlotLabel(slot) {
  const hl = slot.home?.type === 'seed' ? `${slot.home.pos} ${slot.home.group}` : slot.id
  const al = slot.away?.type === 'seed' ? `${slot.away.pos} ${slot.away.group}` : slot.id
  return `${hl} vs ${al}`
}
</script>

<style lang="scss" scoped>
.dst-wrap { display: flex; flex-direction: column; gap: 6px; }
.dst-fields { display: flex; gap: 6px; flex-wrap: wrap; }
</style>
