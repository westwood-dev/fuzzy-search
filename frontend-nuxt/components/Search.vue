<template>
  <div class="search-cont" :class="searchOpen ? 'search-open' : ''">
    <form action="">
      <input
        type="text"
        id="search-input"
        placeholder="Search"
        @focus="searchOpen = true"
        @blur="searchOpen = false"
        :value="query.q"
      />
      <button type="submit">
        <Icon name="material-symbols:search" />
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const searchOpen = ref(false);

onMounted(() => {
  window.addEventListener('keydown', (event) => {
    if (searchOpen && event.key === 'Escape') {
      document.getElementById('search-input')?.blur();
      searchOpen.value = false;
    }
  });
});

const { query } = useRoute();
console.log(query.q);
</script>

<style scoped>
.search-cont {
  position: fixed;
  bottom: 0;
  right: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;

  background-color: blueviolet;
  padding: 0.5rem 1rem;
  border-radius: 10rem;
  display: flex;
  flex-direction: row;

  width: 10rem;
  height: 1rem;

  transition: all 250ms ease-in-out;
}

.search-cont form {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-grow: 1;
}

.search-cont input {
  border: none;
  background-color: transparent;
  color: white;
  width: 100%;
}

.search-cont input:focus {
  outline: none;
}

.search-cont button {
  background: none;
  border: none;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 250ms ease-in-out;
  opacity: 0.7;
}

.search-cont.search-open {
  height: 2rem;
  width: 20rem;
  bottom: 50%;
}

.search-open button {
  font-size: 1.75rem;
  opacity: 1;
}
</style>
