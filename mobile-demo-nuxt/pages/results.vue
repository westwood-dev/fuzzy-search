<template>
  <div>
    <div
      class="latent-grid-container bg-colour"
      :style="{ height: latentGridHeight }"
    >
      <!-- <p>t-sne Mapping</p> -->
      <div class="grid-cont" @click="handleGridClick">
        <LatentGrid
          :results="tsneMapping"
          :resolution="5"
          :style="{ pointerEvents: gridOpen ? 'auto' : 'none' }"
          @cell-click="handleCellClick"
        />
      </div>
      <div class="results-details-cont">
        <div style="display: flex; flex-direction: row; gap: 1rem">
          <p>results</p>
          <p v-if="filter" style="opacity: 0.5">{{ filter }}</p>
        </div>
        <p style="opacity: 0.5">[{{ filteredResults.length }}]</p>
      </div>
    </div>
    <!-- <p>u-map Mapping</p>
    <LatentGrid :results="umapMapping" :resolution="5" /> -->
    <div class="results-list-cont">
      <div class="results-grid">
        <div
          v-for="(result, idx) in filteredResults"
          :key="idx"
          class="result"
          @click="navigateTo(`/document/${result.id}`)"
        >
          <!-- <ResultCard :result='result' /> -->
          <div>
            <p>
              {{ result.title }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResultsStore } from '~/store/resultsStore';

const resultsStore = useResultsStore();

const latentGridHeight = ref<string>('calc(100vw * 1.05)');

const filter = ref<string | null>(null);

const tsneMapping = computed(() => {
  const maxX = Math.max(
    ...resultsStore.results.map((result) => result.tsne_mapping[0])
  );
  const maxY = Math.max(
    ...resultsStore.results.map((result) => result.tsne_mapping[1])
  );
  const minX = Math.min(
    ...resultsStore.results.map((result) => result.tsne_mapping[0])
  );
  const minY = Math.min(
    ...resultsStore.results.map((result) => result.tsne_mapping[1])
  );

  return resultsStore.results.map((result) => {
    return {
      id: result.id,
      x: (result.tsne_mapping[0] - minX) / (maxX - minX),
      y: (result.tsne_mapping[1] - minY) / (maxY - minY),
    };
  });
});

const umapMapping = computed(() => {
  const maxX = Math.max(
    ...resultsStore.results.map((result) => result.umap_mapping[0])
  );
  const maxY = Math.max(
    ...resultsStore.results.map((result) => result.umap_mapping[1])
  );
  const minX = Math.min(
    ...resultsStore.results.map((result) => result.umap_mapping[0])
  );
  const minY = Math.min(
    ...resultsStore.results.map((result) => result.umap_mapping[1])
  );

  return resultsStore.results.map((result) => {
    return {
      id: result.id,
      x: (result.umap_mapping[0] - minX) / (maxX - minX),
      y: (result.umap_mapping[1] - minY) / (maxY - minY),
    };
  });
});

const gridOpen = ref(true);

onBeforeMount(() => {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 5) {
      gridOpen.value = true;
    }
    if (
      window.scrollY < window.innerHeight / 2 &&
      window.innerWidth * 1.05 - window.scrollY > window.innerHeight / 10
    ) {
      latentGridHeight.value = `${window.innerWidth * 1.05 - window.scrollY}px`;
    } else {
      latentGridHeight.value = '10vh';
      gridOpen.value = false;
    }
  });
});

const toggleGrid = (_: any, value?: string) => {
  console.log('Grid Toggle', value);
  if (value) {
    switch (value) {
      case 'open':
        latentGridHeight.value = `${window.innerWidth * 1.05}px`;
        gridOpen.value = true;
        break;

      case 'close':
        latentGridHeight.value = '10vh';
        gridOpen.value = false;
        break;

      default:
        break;
    }
  } else {
    if (gridOpen.value) {
      latentGridHeight.value = '10vh';
      gridOpen.value = false;
    } else {
      latentGridHeight.value = `${window.innerWidth * 1.05}px`;
      gridOpen.value = true;
    }
  }
};

const handleGridClick = () => {
  if (!gridOpen.value) {
    toggleGrid(null);
  }
};

const activeCell = ref<number | null>(null);

const handleCellClick = (cellIndex: number, coords: [number, number]) => {
  if (activeCell.value === cellIndex) {
    activeCell.value = null;
    filter.value = null;
  } else {
    activeCell.value = cellIndex;
    filter.value = `[${coords.join(',')}]`;
  }
};

const filteredResults = computed(() => {
  if (activeCell.value === null) return resultsStore.results;

  return resultsStore.results
    .filter((result) => {
      const mapping = tsneMapping.value.find((m) => m.id === result.id);
      if (!mapping) return false;

      const cellX = Math.min(Math.floor(mapping.x * 5), 4);
      const cellY = Math.min(Math.floor(mapping.y * 5), 4);
      const cellIndex = cellY * 5 + cellX;

      return cellIndex === activeCell.value;
    })
    .sort((a, b) => a.similarity - b.similarity);
});
</script>

<style scoped>
.latent-grid-container {
  overflow: hidden;
  position: fixed;
  top: 5rem;
  width: calc(100% - 2rem);
  transition: height 0.25s;
}

.grid-cont {
  max-width: 100%;
  max-height: 90%;
  height: auto;
  aspect-ratio: 1;
}

.results-list-cont {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: calc(100vw * 1.25);
}

.results-details-cont {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.result {
  background: blueviolet;
  aspect-ratio: 4/5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
</style>
