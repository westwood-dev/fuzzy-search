<template>
  <div>
    <div v-if="data" style="margin-top: 5rem">
      <p>{{ data }}</p>
    </div>
    <div v-else style="margin-top: 5rem"><p>Loading...</p></div>
  </div>
</template>

<script setup lang="ts">
import type { DBResult } from '~/types/result.type';

const route = useRoute();

const data: Ref<DBResult | null> = ref(null);

onMounted(() => {
  console.log('mounted', route.params.id);

  fetch(`http://localhost:8000/article/${route.params.id}`)
    .then((response) => response.json())
    .then((res) => {
      console.log(res);
      data.value = res;
    });
});
</script>
