<template>
  <div>
    <LatentGrid :results="results2D" :resolution="5" />
  </div>
</template>

<script setup lang="ts">
const results2D: Ref<{ x: number; y: number }[]> = ref([]);

for (let i = 0; i < 100; i++) {
  results2D.value.push({
    x: Math.random(),
    y: Math.random(),
  });
}
</script>
