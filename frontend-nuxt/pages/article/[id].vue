<script setup lang="ts">
import type { Article } from '~~/types/article.type';
const { params } = useRoute();

const id = Array.isArray(params.id) ? params.id[0] : params.id;

const { data, status, error } = await useAsyncData<Article>(id, () =>
  $fetch(`http://localhost:8000/article/${id}`)
);
</script>

<template>
  <div class="article-cont">
    <template v-if="status === 'pending'">
      <h1>Loading...</h1>
    </template>
    <template v-else-if="status === 'error'">
      <h1>Error: {{ error }}</h1>
    </template>
    <template v-if="data">
      <h1 class="article-title">{{ data.title }}</h1>
      <div class="article-author-category-cont">
        <p class="article-author">{{ data.authors.join(', ') }}</p>
        <p v-if="data.authors.length > 0 && data.categories.length > 0">|</p>
        <p class="article-category">{{ data.categories.join(', ') }}</p>
      </div>
      <NuxtImg :src="data.image_url" />
      <p v-for="(paragraph, idx) in data.body" :key="idx">
        {{ paragraph }}
      </p>
      <p>
        The data on this site is from
        <a href="https://www.creativeapplications.net/"
          >creativeapplications.net</a
        >
      </p>

      <!-- <p>{{ data.body }}</p> -->
    </template>
  </div>
</template>

<style scoped>
.article-cont {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.article-title {
  font-size: 2rem;
  margin-bottom: 0;
}

.article-author-category-cont {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: grey;
}

img {
  max-width: 100%;
  height: auto;
}
</style>
