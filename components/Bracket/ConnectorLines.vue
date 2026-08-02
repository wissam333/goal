<template>
  <svg
    ref="svgEl"
    class="connector-svg"
    :viewBox="`0 0 80 ${svgH}`"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    <polyline
      v-for="(ln, i) in lines"
      :key="i"
      :points="ln.pts"
      :class="['conn-line', { 'conn-win': ln.win }]"
    />
  </svg>
</template>

<script setup>
const props = defineProps({
  from: { type: Number, required: true },
  to:   { type: Number, required: true },
  winners: { type: Array, default: () => [] },
});

const svgEl = ref(null);
const svgH  = ref(300); // live-measured height

// Measure the real rendered height via ResizeObserver
onMounted(() => {
  if (!svgEl.value) return;
  const ro = new ResizeObserver(([entry]) => {
    svgH.value = Math.round(entry.contentRect.height) || 300;
  });
  ro.observe(svgEl.value);
  onUnmounted(() => ro.disconnect());
});

/**
 * Given n evenly-spaced cards that fill the full height H,
 * return the Y midpoint of card at index i (0-based).
 *   slot height = H / n
 *   midpoint    = slot * i + slot/2
 */
function midpoints(count, H) {
  const slot = H / count;
  return Array.from({ length: count }, (_, i) => slot * i + slot / 2);
}

/**
 * Each "from" card fans out to its paired "to" card.
 * Pairing rule: cards are grouped in pairs from the left side
 * to produce the next round. e.g. QF[0,1] → SF[0], QF[2,3] → SF[1]
 * Returns array of SVG polyline point-strings.
 */
const lines = computed(() => {
  const H    = svgH.value;
  const W    = 80;
  const mid  = W / 2;
  const fromY = midpoints(props.from, H);
  const toY   = midpoints(props.to,   H);

  const result = [];
  const ratio = props.from / props.to;

  toY.forEach((ty, ti) => {
    const start = Math.round(ti * ratio);
    const end   = Math.round((ti + 1) * ratio);

    for (let fi = start; fi < end; fi++) {
      const fy = fromY[fi];
      const pts = `0,${fy} ${mid},${fy} ${mid},${ty} ${W},${ty}`;
      result.push({ pts, win: !!props.winners[fi] });
    }
  });

  return result;
});
</script>

<style lang="scss" scoped>
.connector-svg {
  width: 100%;
  max-width: 80px;
  height: 100%;
  display: block;

  .conn-line {
    fill: none;
    stroke: var(--border-color);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: stroke 0.2s;
  }
  .conn-win {
    stroke: var(--primary);
  }
}
</style>