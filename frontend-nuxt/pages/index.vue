<template>
  <div class="site-cont">
    <h1>Search</h1>
    <form action="" :onsubmit="searchSubmit">
      <input type="text" v-model="search" placeholder="Search..." />
      <button type="submit">Search</button><br />
      <input
        type="checkbox"
        name="title-only"
        id="title-check"
        v-model="titleCheck"
      />
      <label for="title-check">Title</label>
      <input
        type="checkbox"
        name="body-only"
        id="body-check"
        v-model="bodyCheck"
      />
      <label for="body-check">Body</label>
    </form>
    <p>{{ titleCheck }}, {{ bodyCheck }}</p>
    <div>
      <ClientOnly>
        <template v-if="searchResults.length === 0">
          <p>No results</p>
        </template>
        <div
          class="result-cont"
          v-for="(result, idx) in searchResults"
          :key="idx"
        >
          <h2>{{ result.title }}</h2>
          <p>{{ result.authors[0] }}</p>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Article } from '~~/types/article.type';

const search = ref('');
const searchResults: Ref<Article[]> = ref([]);

const titleCheck: Ref<Boolean> = ref(true);
const bodyCheck: Ref<Boolean> = ref(false);

const checkValue = () => {
  console.log(`${titleCheck.value}${bodyCheck.value}`);
  switch (`${titleCheck.value}${bodyCheck.value}`) {
    case 'truefalse':
      return 'title';
    case 'falsetrue':
      return 'body';
    default:
      return 'all';
  }
};

const executeQuery = async () => {
  console.log(checkValue());
  const data = await $fetch(`http://localhost:8000/search/${checkValue()}`, {
    method: 'POST',
    body: {
      query: search.value,
    },
  });

  // const data: { results: Article[] } = await $fetch(
  //   `http://localhost:8000/search/${checkValue()}`,
  //   {
  //     method: 'post',
  //     body: {
  //       query: search.value,
  //     },
  //   }
  // );
  if (data.results === undefined || data.results.length === 0) {
    console.log('No results');
    searchResults.value = [];
    return;
  } else {
    console.log(data);
    searchResults.value = data.results;
    return;
  }
};

const searchSubmit = (e: Event) => {
  e.preventDefault();
  if (search.value === '') {
    return;
  }
  console.log('Query:', search.value);
  executeQuery();
};
</script>

<style scoped>
.site-cont {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.result-cont {
  /* margin-top: 1rem; */
  padding: 1rem;
  border: 1px solid rgba(var(--text), 0.4);
  border-width: 0 0 1px 0;
}

.result-cont h2 {
  margin-bottom: 0;
}

.result-cont p {
  margin-top: 0;
}
</style>
