<script setup lang="ts">
defineProps({
  error: Object,
});

const handleError = () => clearError({ redirect: '/' });
</script>

<template>
  <div>
    <h2>{{ error?.statusCode }}</h2>
    <p>Oops, not sure what happened there</p>
    <p id="homeBTN" @click="handleError">head home</p>
  </div>
</template>

<style scoped>
div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

h2 {
  font-family: monospace;
  font-size: 200px;
  text-align: center;
  margin: 0;
  padding: 0;
}

p {
  margin: 0;
}

#homeBTN {
  color: lightblue;
  cursor: pointer;
  text-decoration: underline;
}
</style>
