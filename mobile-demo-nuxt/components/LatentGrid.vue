<template>
  <div>
    <ClientOnly>
      <div
        class="grid-cont"
        :style="{ gridTemplateColumns: `repeat(${props.resolution}, 1fr)` }"
      >
        <div
          v-for="(cell, index) in props.resolution * props.resolution"
          :key="index"
          class="grid-cell"
          :class="{ 'grid-cell-active': activeCell === index }"
          :style="{
            opacity: getCellOpacity(index),
            transform: `scale(${
              activeCell === null || activeCell === index ? 1 : 0.8
            })`,
          }"
          @click="handleCellClick(index)"
        >
          <div style="font-size: 0.25rem">
            {{ getCellCoordinates(index).join(',') }}
          </div>
        </div>
        <DevOnly>
          <div
            class="dev-results-cont"
            style="pointer-events: none"
            :style="{ display: dev_showPoints ? 'block' : 'none' }"
          >
            <div class="dev-results-holder">
              <div
                v-for="(result, idx) in props.results"
                :key="idx"
                class="dev-result"
                :style="{
                  left: `${result.x * 100}%`,
                  top: `${result.y * 100}%`,
                }"
              ></div>
            </div>
          </div>
          <!-- <div
            class="dev-controls"
            style="
              position: fixed;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              width: 100%;
              padding: 1rem;
            "
          >
            <button @click="dev_togglePoints">Toggle Points</button>
          </div> -->
        </DevOnly>
      </div>
    </ClientOnly>
    <!-- {{ results }} -->
  </div>
</template>

<script setup lang="ts">
import type { IMapping } from '~/types/result.type';

const props = defineProps<{
  results: IMapping[];
  resolution: number;
}>();

const emit = defineEmits(['cell-click']);

const cellPointCounts = computed(() => {
  const counts = Array(props.resolution * props.resolution).fill(0);
  props.results.forEach((result) => {
    const cellX = Math.min(
      Math.floor(result.x * props.resolution),
      props.resolution - 1
    );
    const cellY = Math.min(
      Math.floor(result.y * props.resolution),
      props.resolution - 1
    );
    const cellIndex = cellY * props.resolution + cellX;

    if (cellIndex >= 0 && cellIndex < counts.length) {
      counts[cellIndex]++;
    } else {
      console.warn(`Invalid cell index: ${cellIndex}`, {
        x: result.x,
        y: result.y,
      });
    }
  });
  return counts;
});

const getCellOpacity = (index: number) => {
  const count = cellPointCounts.value[index];
  if (count === 0) return 0;

  // Get all non-zero counts
  const nonZeroCounts = cellPointCounts.value.filter((c) => c > 0);
  const avgCount =
    nonZeroCounts.reduce((a, b) => a + b, 0) / nonZeroCounts.length;

  // Use a logarithmic scale to reduce extreme differences
  return 0.2 + (0.8 * Math.log(count + 1)) / Math.log(avgCount + 1);
};

const activeCell = ref<number | null>(null);

const getCellCoordinates = (index: number): [number, number] => {
  const x = index % props.resolution;
  const y = Math.floor(index / props.resolution);

  // Convert to coordinate system with 0,0 at center
  const centerOffset = Math.floor(props.resolution / 2);
  return [x - centerOffset, centerOffset - y];
};

const handleCellClick = (index: number) => {
  activeCell.value = activeCell.value === index ? null : index;
  const coords = getCellCoordinates(index);
  console.log('Cell clicked:', { index, coords });
  emit('cell-click', index, coords);
};

// DEV

const dev_showPoints = ref(true);

const dev_togglePoints = () => {
  if (dev_showPoints.value) {
    dev_showPoints.value = false;
  } else {
    dev_showPoints.value = true;
  }
};

onMounted(() => {
  console.log(props.results);
});
</script>

<style scoped>
.grid-cont {
  width: 100%;
  aspect-ratio: 1;
  background-color: black;
  display: grid;
  position: relative;
  border: solid white 1px;
  padding: 0.25rem;
}

.grid-cell {
  width: 100%;
  aspect-ratio: 1;
  background-color: white;
  box-sizing: border-box;
  border: solid white 1px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 1;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.grid-cell-active {
  transform: scale(1.1) !important;
  z-index: 2;
  border-color: yellow;
}

.dev-results-cont {
  width: 100%;
  aspect-ratio: 1;
  position: absolute;
  inset: 0;
  padding: 0.25rem;
}

.dev-results-holder {
  width: 100%;
  aspect-ratio: 1;
  position: relative;
}

.dev-result {
  width: 5px;
  border-radius: 10px;
  aspect-ratio: 1;
  background-color: red;
  position: absolute;
  transform: translate(-50%, -50%);
}
</style>
