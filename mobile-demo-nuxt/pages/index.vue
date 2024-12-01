<template>
  <div class="search-cont">
    <div class="search-holder">
      <input
        type="text"
        placeholder="Search..."
        ref="searchInput"
        @submit="handleSearch"
        @keydown.enter="handleSearch"
      />
      <button @click="handleSearch">
        <Icon
          :name="
            loading ? 'svg-spinners:90-ring' : 'material-symbols:arrow-forward'
          "
        ></Icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResultsStore } from '~/store/resultsStore';

const loading = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

const router = useRouter();

const resultsStore = useResultsStore();

const handleSearch = (e: Event) => {
  console.log(e);
  console.log(searchInput.value!.value);
  loading.value = true;

  getData(searchInput.value!.value).then((data) => {
    // router.push({
    //   name: 'results',
    //   params: { query: searchInput.value!.value, data: data },
    // });
    resultsStore.setResults(data.results);
    navigateTo('/results');
  });
};

const getData = async (queryString: string) => {
  const query = `{
  "query": "${queryString}",
  "network": false,
  "count": 100,
  "exact_boost": 5,
  "re_rank": false,
  "types": [
    "article"
  ]
}`;

  const response = await fetch('http://localhost:8000/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: query,
  });

  const data = await response.json();
  console.log(data);
  return data;
};
</script>

<style scoped>
.search-cont {
  height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.search-holder {
  display: flex;
  flex-direction: row;
  border: solid rgb(var(--text));
  border-width: 0 0 1px 0;
  width: 100%;
}

.search-holder input {
  width: 100%;
  padding: 0;
  border: none;
  font-size: 1.25rem;
  background-color: transparent;
  color: rgb(var(--text));
}

input:focus {
  outline: none;
}

.search-holder button {
  background-color: transparent;
  border: none;
  color: rgb(var(--text));
  font-size: 1.25rem;
}
</style>
