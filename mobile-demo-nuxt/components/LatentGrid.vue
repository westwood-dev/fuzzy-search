<template>
  <div>
    <div
      class="grid-cont"
      :style="{ gridTemplateColumns: `repeat(${props.resolution}, 1fr)` }"
    >
      <div
        v-for="(cell, index) in props.resolution * props.resolution"
        :key="index"
        class="grid-cell"
        :style="{ opacity: getCellOpacity(index) }"
      >
        <div>{{ index + 1 }}</div>
      </div>
      <DevOnly>
        <div class="dev-results-cont">
          <div class="dev-results-holder">
            <div
              v-for="(result, idx) in props.results"
              :key="idx"
              class="dev-result"
              :style="{ left: `${result.x * 100}%`, top: `${result.y * 100}%` }"
            ></div>
          </div>
        </div>
      </DevOnly>
    </div>

    {{ results }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  results: { x: number; y: number }[];
  resolution: number;
}>();

const cellPointCounts = computed(() => {
  const counts = Array(props.resolution * props.resolution).fill(0);
  props.results.forEach((result) => {
    const cellX = Math.floor(result.x * props.resolution);
    const cellY = Math.floor(result.y * props.resolution);
    const cellIndex = cellY * props.resolution + cellX;
    counts[cellIndex]++;
  });
  return counts;
});

const getCellOpacity = (index: number) => {
  const maxCount = Math.max(...cellPointCounts.value);
  return maxCount > 0 ? cellPointCounts.value[index] / maxCount : 0;
};
</script>

<style scoped>
.grid-cont {
  width: 100%;
  aspect-ratio: 1;
  background-color: black;
  display: grid;
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
}

.dev-results-cont {
  width: 100%;
  aspect-ratio: 1;
  position: absolute;
  inset: 0;
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
