<script setup lang="ts">
const props = defineProps({
  error: Object,
});

const route = useRoute();

const handleError = () => clearError({ redirect: '/' });
</script>

<template>
  <div>
    <h2>{{ error?.statusCode }}</h2>
    <p>ain't my fault bro, i swear</p>
    <p id="homeBTN" @click="handleError">go drunk, ur home</p>
    <!-- <p>{{ route.path.split('/')[1] }}</p> -->
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
  font-family: 'Poppins';
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
