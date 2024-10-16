<script setup lang="ts">
import { ref } from 'vue';
import type { Article } from '~~/types/article.type';
import type { NetworkData } from '~~/types/network.type';

const networkData = ref<NetworkData>({
  nodes: [],
  links: [],
});

const executeQuery = async () => {
  try {
    const response = await fetch(`http://localhost:8000/network`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    // console.log('Network data:', data);
    networkData.value = data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

onMounted(() => {
  executeQuery();
});
</script>

<template>
  <div>
    <div class="network-cont">
      <Network :data="networkData" />
    </div>

    <Search />

    <IconButtonExpanding
      position="left-bottom"
      iconName="material-symbols:info-i"
    >
      <h2 style="margin-bottom: 0">Info</h2>
      <NuxtLink to="/about">About</NuxtLink><br />
      <NuxtLink to="/docs">Docs</NuxtLink><br />
      <NuxtLink to="/upload">Upload</NuxtLink>
    </IconButtonExpanding>

    <IconButton
      style="position: fixed; bottom: 0; right: 0"
      iconName="material-symbols:upload"
      :onClickFunction="() => navigateTo('/upload')"
    />

    <!-- Collapsable menu -->
    <Collapsable />
  </div>
</template>

<style scoped>
.network-cont {
  height: 100lvh;
  width: 100lvw;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 0;
}
</style>
